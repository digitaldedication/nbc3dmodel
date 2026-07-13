// Dump de structuur van de "Opstellingen"-container per scène: welke
// hal-groepen bestaan er, hoeveel meshes, en waar staan ze (wereld-bbox)?
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const key = process.argv[2] || 'congres';
const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent(`/assets/spline/${key}/scene.splinecode`)}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });

  const out = await page.evaluate(() => {
    const app = window.__app;
    const bboxOf = (o) => {
      const min = { x: Infinity, y: Infinity, z: Infinity }, max = { x: -Infinity, y: -Infinity, z: -Infinity };
      let meshes = 0;
      o.traverse((m) => {
        if (!m.isMesh || !m.geometry) return;
        meshes++;
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        m.updateWorldMatrix(true, false);
        const bb = m.geometry.boundingBox;
        const e = m.matrixWorld.elements;
        for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
          const wx = e[0] * x + e[4] * y + e[8] * z + e[12];
          const wy = e[1] * x + e[5] * y + e[9] * z + e[13];
          const wz = e[2] * x + e[6] * y + e[10] * z + e[14];
          min.x = Math.min(min.x, wx); max.x = Math.max(max.x, wx);
          min.y = Math.min(min.y, wy); max.y = Math.max(max.y, wy);
          min.z = Math.min(min.z, wz); max.z = Math.max(max.z, wz);
        }
      });
      const r = (v) => +v.toFixed(1);
      return meshes ? { meshes, min: [r(min.x), r(min.y), r(min.z)], max: [r(max.x), r(max.y), r(max.z)] } : { meshes: 0 };
    };
    const containers = [];
    app._scene.traverse((o) => {
      if ((o.name || '').trim() === 'Opstellingen') containers.push(o);
    });
    return containers.map((c) => ({
      children: c.children.map((sceneGroep) => ({
        name: sceneGroep.name,
        visible: sceneGroep.visible,
        halGroepen: sceneGroep.children.map((h) => ({
          name: h.name,
          visible: h.visible,
          children: h.children.length,
          childNames: h.children.slice(0, 12).map((x) => (x.name || '') + (x.isMesh ? ' [mesh]' : ` (${x.children.length}k)`)),
          bbox: bboxOf(h),
        })),
      })),
    }));
  });
  console.log(JSON.stringify(out, null, 1));
} finally {
  await browser.close();
  server.kill();
}
