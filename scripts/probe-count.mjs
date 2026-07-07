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
    let pgh = null;
    scene.traverse((o) => { if (!pgh && (o.name || '').trim() === 'Podium Grand Hall') pgh = o; });
    if (!pgh) return 'geen podium';
    const wbox = (m) => {
      m.updateWorldMatrix(true, false);
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox, e = m.matrixWorld.elements;
      let mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9];
      for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
        const w = [e[0]*x+e[4]*y+e[8]*z+e[12], e[1]*x+e[5]*y+e[9]*z+e[13], e[2]*x+e[6]*y+e[10]*z+e[14]];
        for (let k=0;k<3;k++){ mn[k]=Math.min(mn[k],w[k]); mx[k]=Math.max(mx[k],w[k]); }
      }
      return { size: [mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]].map(v=>+v.toFixed(1)), cz: +((mn[2]+mx[2])/2).toFixed(1), cy: +((mn[1]+mx[1])/2).toFixed(1), cx: +((mn[0]+mx[0])/2).toFixed(1) };
    };
    const out = [];
    const walk = (o, d) => {
      out.push({ d, name: o.name, mesh: !!o.isMesh, box: o.isMesh ? wbox(o) : undefined, mat: o.isMesh && o.material && !Array.isArray(o.material) ? o.material.name : undefined });
      for (const c of o.children || []) walk(c, d+1);
    };
    walk(pgh, 0);
    return out;
  });
  console.log(JSON.stringify(rep, null, 1));
} finally { await browser.close(); server.kill(); }
