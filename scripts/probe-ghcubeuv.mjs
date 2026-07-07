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

  const rep = await page.evaluate(() => {
    const scene = window.__app._scene;
    let schermMidden = null, cube = null;
    scene.traverse((o) => { if (!schermMidden && (o.name || '').trim() === 'Scherm midden') schermMidden = o; });
    if (!schermMidden) return 'geen Scherm midden';
    schermMidden.traverse((o) => { if (!cube && o.isMesh && /^Cube/.test((o.name || '').trim())) cube = o; });
    if (!cube) return 'geen cube';
    const g = cube.geometry;
    const pos = g.attributes.position, uv = g.attributes.uv;
    if (!uv) return { name: cube.name, hasUv: false, count: pos.count };
    // vind de as-extents en groepeer hoekpunten van het grootste vlak
    let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
    for (let i = 0; i < pos.count; i++) {
      const p = [pos.getX(i), pos.getY(i), pos.getZ(i)];
      for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); }
    }
    const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    // dunste as = normaal van het scherm; verzamel verts op beide uitersten van die as
    const thin = size.indexOf(Math.min(...size));
    const out = { name: cube.name, count: pos.count, size, thinAxis: thin, faces: {} };
    for (const side of ['min', 'max']) {
      const target = side === 'min' ? min[thin] : max[thin];
      const pts = [];
      for (let i = 0; i < pos.count && pts.length < 12; i++) {
        const p = [pos.getX(i), pos.getY(i), pos.getZ(i)];
        if (Math.abs(p[thin] - target) < size[thin] * 0.05 + 1e-6) {
          pts.push({ p: p.map((v) => +v.toFixed(1)), uv: [+uv.getX(i).toFixed(3), +uv.getY(i).toFixed(3)] });
        }
      }
      out.faces[side] = pts;
    }
    return out;
  });
  console.log(JSON.stringify(rep, null, 1));
} finally {
  await browser.close();
  server.kill();
}
