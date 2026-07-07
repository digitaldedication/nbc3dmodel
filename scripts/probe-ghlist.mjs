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
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });

  const rep = await page.evaluate(() => {
    const scene = window.__app._scene;
    let sm = null;
    scene.traverse((o) => { if (!sm && (o.name || '').trim() === 'Scherm midden') sm = o; });
    if (!sm) return 'geen Scherm midden';
    const wbox = (m) => {
      m.updateWorldMatrix(true, false);
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox, e = m.matrixWorld.elements;
      let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
      for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
        const w = [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]];
        for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], w[k]); max[k] = Math.max(max[k], w[k]); }
      }
      return [max[0] - min[0], max[1] - min[1], max[2] - min[2]].map((v) => +v.toFixed(1));
    };
    const out = [];
    const walk = (o, depth, path) => {
      const layers = o.isMesh && o.material && !Array.isArray(o.material) && o.material.layers
        ? (o.material.layers.layers || o.material.layers || []).length : undefined;
      out.push({
        d: depth, name: o.name, type: o.type, mesh: !!o.isMesh, visible: o.visible,
        size: o.isMesh ? wbox(o) : undefined,
        mat: o.isMesh && o.material ? (Array.isArray(o.material) ? o.material.map((m) => m.name) : o.material.name) : undefined,
      });
      for (const c of o.children || []) walk(c, depth + 1, path);
    };
    walk(sm, 0);
    return out;
  });
  console.log(JSON.stringify(rep, null, 1));
} finally {
  await browser.close();
  server.kill();
}
