import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const key = process.argv[2] || 'sitdown';
const names = (process.argv[3] || '').split(',').filter(Boolean);

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

  const report = await page.evaluate((names) => {
    const app = window.__app;
    const centerOf = (root) => {
      let n = 0, x = 0, y = 0, z = 0;
      root.updateWorldMatrix(true, true);
      root.traverse((o) => {
        if (!o.isMesh) return;
        const e = o.matrixWorld.elements;
        x += e[12]; y += e[13]; z += e[14]; n++;
      });
      if (root.isMesh && n === 0) { const e = root.matrixWorld.elements; return { x: e[12], y: e[13], z: e[14], meshes: 1 }; }
      return n ? { x: x / n, y: y / n, z: z / n, meshes: n } : null;
    };
    const out = [];
    for (const name of names) {
      app._scene.traverse((o) => {
        if ((o.name || '').trim() === name.trim()) {
          const c = centerOf(o);
          out.push({ name, parent: o.parent && o.parent.name, center: c && { x: +c.x.toFixed(1), y: +c.y.toFixed(1), z: +c.z.toFixed(1), meshes: c.meshes } });
        }
      });
    }
    return out;
  }, names);
  console.log(JSON.stringify(report, null, 1));
} finally {
  await browser.close();
  server.kill();
}
