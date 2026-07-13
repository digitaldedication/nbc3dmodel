// Alle Instance-nodes onder 'Stoelen Grid podium' met naam + bbox-centrum.
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
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 3000));
  const out = await page.evaluate(() => {
    const scene = window.__app._scene;
    let grid = null;
    scene.traverse((o) => { if (!grid && (o.name || '') === 'Stoelen Grid podium') grid = o; });
    const items = [];
    const boxOf = (o) => {
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, n = 0;
      o.updateWorldMatrix(true, true);
      o.traverse((m) => {
        if (!m.isMesh || !m.geometry) return;
        n++;
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        const bb = m.geometry.boundingBox, e = m.matrixWorld.elements;
        for (const x of [bb.min.x, bb.max.x]) for (const z of [bb.min.z, bb.max.z]) {
          const wx = e[0] * x + e[8] * z + e[12], wz = e[2] * x + e[10] * z + e[14];
          if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
          if (wz < minZ) minZ = wz; if (wz > maxZ) maxZ = wz;
        }
      });
      return n ? { n, cx: Math.round((minX + maxX) / 2), cz: Math.round((minZ + maxZ) / 2), w: Math.round(maxX - minX) } : null;
    };
    grid.traverse((o) => {
      if (o.data && o.data.type === 'Instance') {
        items.push({ naam: o.data.name || o.name || '(naamloos)', diepte: (() => { let d = 0, p = o; while (p && p !== grid) { d++; p = p.parent; } return d; })(), box: boxOf(o) });
      }
    });
    return items;
  });
  for (const it of out) console.log(JSON.stringify(it));
} finally {
  await browser.close();
  server.kill();
}
