import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const key = process.argv[2] || 'congres';
const targets = (process.argv[3] || 'Pilaar 2,Cube').split(',');

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => {
    const file = route.request().url().split('/').pop();
    route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${file}` }).catch(() => route.abort());
  });
  await page.route('**://unpkg.com/@splinetool/**', (route) => {
    const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/);
    if (!m) return route.abort();
    route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort());
  });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent(`/assets/spline/${key}/scene.splinecode`)}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });

  const report = await page.evaluate((targets) => {
    const app = window.__app;
    const dump = (v, depth = 0) => {
      if (v == null) return v;
      if (typeof v !== 'object') return v;
      if (depth > 5) return '[diep]';
      if (v.isColor) return { __color: '#' + v.getHexString() };
      if (v.isTexture) return { __texture: (v.image && v.image.width) + 'x' + (v.image && v.image.height) };
      if (Array.isArray(v)) return v.slice(0, 12).map((x) => dump(x, depth + 1));
      const o = {};
      for (const k of Object.keys(v).slice(0, 25)) {
        if (['parent', 'children', 'shared', 'thisContext', 'material', 'mesh'].includes(k)) continue;
        o[k] = dump(v[k], depth + 1);
      }
      return o;
    };
    const out = [];
    for (const t of targets) {
      let mesh = null;
      app._scene.traverse((o) => { if (!mesh && o.isMesh && (o.name || '').trim() === t.trim() && o.material) mesh = o; });
      if (!mesh) { out.push({ target: t, found: false }); continue; }
      const m = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      out.push({
        target: t,
        matName: m.name,
        dataLayers: dump(m.data && m.data.layers),
        runtimeLayers: dump(m.layers),
      });
    }
    return out;
  }, targets);
  console.log(JSON.stringify(report, null, 1));
} finally {
  await browser.close();
  server.kill();
}
