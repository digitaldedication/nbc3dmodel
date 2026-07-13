import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => console.log('[page]', m.text()));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 5000));

  const out = await page.evaluate(() => {
    const app = window.__app;
    const rows = [];
    app._scene.traverse((group) => {
      if (!/NBC logo's pilaar/i.test(group.name || '')) return;
      for (const r of (group.children || [])) {
        if (!r.isMesh) continue;
        if (!r.geometry.boundingBox) r.geometry.computeBoundingBox();
        r.updateWorldMatrix(true, false);
        const bb = r.geometry.boundingBox;
        const gsize = { x: bb.max.x - bb.min.x, y: bb.max.y - bb.min.y, z: bb.max.z - bb.min.z };
        const e = r.matrixWorld.elements;
        const sx = Math.hypot(e[0], e[1], e[2]);
        const sy = Math.hypot(e[4], e[5], e[6]);
        const sz = Math.hypot(e[8], e[9], e[10]);
        rows.push({
          group: group.name, name: r.name,
          rot: r.rotation ? [r.rotation.x, r.rotation.y, r.rotation.z].map((v) => +v.toFixed(3)) : null,
          geom: { x: +gsize.x.toFixed(3), y: +gsize.y.toFixed(3), z: +gsize.z.toFixed(3) },
          worldScale: [ +sx.toFixed(4), +sy.toFixed(4), +sz.toFixed(4) ],
          world: { x: +(gsize.x * sx).toFixed(3), y: +(gsize.y * sy).toFixed(3), z: +(gsize.z * sz).toFixed(3) },
          hm: Array.isArray(r.data && r.data.hiddenMatrix) ? r.data.hiddenMatrix.map((v) => +(+v).toFixed(4)) : null,
        });
      }
    });
    return rows.slice(0, 6);
  });
  console.log(JSON.stringify(out, null, 2));
} finally {
  await browser.close();
  server.kill();
}
