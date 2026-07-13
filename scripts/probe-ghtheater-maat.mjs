// Maatvoering voor de volledige theateropstelling: rijposities/-maten,
// blokposities, en wat er in het middenschip staat (tafels e.d.).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  page.on('console', (m) => console.log('[page]', m.text().slice(0, 300)));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 3000));

  const out = await page.evaluate(() => {
    const scene = window.__app._scene;
    const worldBoxOf = (o) => {
      const min = { x: Infinity, y: Infinity, z: Infinity }, max = { x: -Infinity, y: -Infinity, z: -Infinity };
      let meshes = 0;
      o.updateWorldMatrix(true, true);
      o.traverse((m) => {
        if (!m.isMesh || !m.geometry) return;
        meshes++;
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
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
      return meshes ? { meshes, x: [r(min.x), r(max.x)], y: [r(min.y), r(max.y)], z: [r(min.z), r(max.z)] } : { meshes: 0 };
    };
    let ghCongres = null;
    scene.traverse((o) => {
      if (!ghCongres && (o.name || '').trim() === 'Congres' && o.parent && (o.parent.name || '').trim() === 'Grand Hall') ghCongres = o;
    });
    const grid = ghCongres.children.find((c) => c.name === 'Stoelen Grid podium');
    const rapport = { ghCongresKinderen: {} };
    for (const kind of ghCongres.children) {
      rapport.ghCongresKinderen[kind.name || '(naamloos)'] = worldBoxOf(kind);
    }
    rapport.gridKinderen = grid.children.map((c) => ({
      name: c.name || '(naamloos)', type: c.data && c.data.type, box: worldBoxOf(c),
    }));
    const blok = grid.children.find((c) => /Stoelen 10x10/.test(c.name || ''));
    rapport.blokRijen = blok.children.map((rij) => ({
      name: rij.name, localPos: [rij.position.x, rij.position.y, rij.position.z].map((v) => +v.toFixed(2)),
      box: worldBoxOf(rij),
    }));
    // ook de zaal zelf (muren) om de bruikbare vloer te bepalen
    let zaal = null;
    scene.traverse((o) => { if (!zaal && /grand hall/i.test(o.name || '') && o !== ghCongres.parent) zaal = o; });
    rapport.zaalNaam = zaal && zaal.name;
    return rapport;
  });
  console.log(JSON.stringify(out, null, 1));
} finally {
  await browser.close();
  server.kill();
}
