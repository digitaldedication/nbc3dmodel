import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 8000));

  const info = await page.evaluate(() => {
    const app = window.__app;
    const scene = app._scene;
    const wbox = (o) => {
      let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity], any = false;
      o.updateWorldMatrix(true, false);
      o.traverse((m) => {
        if (!m.isMesh || !m.geometry) return;
        any = true;
        m.updateWorldMatrix(true, false);
        m.geometry.computeBoundingBox();
        const bb = m.geometry.boundingBox;
        const e = m.matrixWorld.elements;
        for (const cx of [bb.min.x, bb.max.x]) for (const cy of [bb.min.y, bb.max.y]) for (const cz of [bb.min.z, bb.max.z]) {
          const wy = e[1] * cx + e[5] * cy + e[9] * cz + e[13];
          const wx = e[0] * cx + e[4] * cy + e[8] * cz + e[12];
          const wz = e[2] * cx + e[6] * cy + e[10] * cz + e[14];
          if (wx < min[0]) min[0] = wx; if (wx > max[0]) max[0] = wx;
          if (wy < min[1]) min[1] = wy; if (wy > max[1]) max[1] = wy;
          if (wz < min[2]) min[2] = wz; if (wz > max[2]) max[2] = wz;
        }
      });
      if (!any) return null;
      return { ySpan: [min[1].toFixed(1), max[1].toFixed(1)], size: [(max[0] - min[0]).toFixed(1), (max[1] - min[1]).toFixed(1), (max[2] - min[2]).toFixed(1)] };
    };
    let rep = null;
    scene.traverse((g) => {
      if (rep || !/Pilaar met logo Instance 4/i.test(g.name || '')) return;
      const dump = (o, d) => ({
        name: o.name, type: o.type, isMesh: !!o.isMesh, isSkinned: !!o.isSkinnedMesh,
        box: wbox(o),
        scale: [o.scale.x.toFixed(3), o.scale.y.toFixed(3), o.scale.z.toFixed(3)],
        children: d < 3 ? (o.children || []).map((c) => dump(c, d + 1)) : (o.children || []).length,
      });
      rep = dump(g, 0);
    });
    return rep;
  });
  console.log(JSON.stringify(info, null, 2));
} finally {
  await browser.close();
  server.kill();
}
