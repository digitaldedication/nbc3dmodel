// Zoek het juiste "shared"-contextobject (met getVariable) in de app.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
  page.on('console', (m) => console.log('[page]', m.text().slice(0, 300)));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });

  const res = await page.evaluate(() => {
    const app = window.__app;
    const methodsOf = (o) => {
      if (!o) return null;
      const out = new Set();
      let p = o;
      for (let i = 0; i < 4 && p; i++, p = Object.getPrototypeOf(p)) {
        for (const k of Object.getOwnPropertyNames(p)) {
          try { if (typeof o[k] === 'function') out.add(k); } catch {}
        }
      }
      return [...out].filter((k) => /var|Var|shared|Shared|get|find/.test(k)).slice(0, 40);
    };
    // zoek app-properties met getVariable
    const withGetVariable = [];
    const seen = new Set();
    const scan = (o, path, depth) => {
      if (!o || typeof o !== 'object' || depth > 2 || seen.has(o)) return;
      seen.add(o);
      try { if (typeof o.getVariable === 'function') { withGetVariable.push(path); return; } } catch {}
      for (const k of Object.keys(o)) {
        if (k.startsWith('__')) continue;
        try { scan(o[k], path + '.' + k, depth + 1); } catch {}
      }
    };
    scan(app, 'app', 0);
    return {
      samMethods: methodsOf(app._sharedAssetsManager),
      withGetVariable: withGetVariable.slice(0, 10),
      appKeys: Object.keys(app).filter((k) => /var|state|shared|scene|runtime/i.test(k)),
    };
  });
  console.log(JSON.stringify(res, null, 1));
} finally {
  await browser.close();
  server.kill();
}
