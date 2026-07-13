// Structuur van de Grand Hall-congresopstelling + kloontest: rendert een
// gekloonde stoelenrij op een nieuwe positie?
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  page.on('console', (m) => console.log('[page]', m.text().slice(0, 300)));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 4000));

  const out = await page.evaluate(() => {
    const app = window.__app;
    let gh = null;
    app._scene.traverse((o) => {
      if (gh) return;
      if ((o.name || '').trim() === 'Grand Hall' && o.parent && (o.parent.name || '').trim() === 'Congres') gh = o;
    });
    // vind de groep 'Grand Hall' onder de Opstellingen-container
    if (!gh) {
      app._scene.traverse((o) => {
        if (gh || (o.name || '').trim() !== 'Opstellingen') return;
        const scene = o.children[0];
        gh = (scene.children || []).find((c) => (c.name || '').trim() === 'Grand Hall') || null;
      });
    }
    if (!gh) return { fail: 'GH groep niet gevonden' };
    const describe = (o, depth, maxDepth) => ({
      name: o.name || '',
      type: o.type,
      isMesh: !!o.isMesh,
      isInstanced: !!o.isInstancedMesh,
      count: o.count || undefined,
      children: o.children.length,
      pos: o.position ? [o.position.x, o.position.y, o.position.z].map((v) => +v.toFixed(1)) : null,
      hasData: !!o.data,
      kids: depth < maxDepth ? o.children.slice(0, 8).map((k) => describe(k, depth + 1, maxDepth)) : undefined,
    });
    return describe(gh, 0, 3);
  });
  console.log(JSON.stringify(out, null, 1));
} finally {
  await browser.close();
  server.kill();
}
