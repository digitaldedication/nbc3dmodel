// Kloontest 3: blok toevoegen via updateTreeByOp + wereldpositie/meshcount
// diagnostiek + projectie naar schermcoördinaten voor gerichte pixelcheck.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  page.on('console', (m) => console.log('[page]', m.text().slice(0, 400)));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 4000));

  const res = await page.evaluate(() => {
    const app = window.__app;
    const scene = app._scene;
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
      return { meshes, min: [r(min.x), r(min.y), r(min.z)], max: [r(max.x), r(max.y), r(max.z)] };
    };
    let grid = null;
    scene.traverse((o) => { if (!grid && (o.name || '') === 'Stoelen Grid podium') grid = o; });
    const blocks = grid.children.filter((c) => /Stoelen 10x10/.test(c.name || ''));
    const info = {
      blocks: blocks.map((b) => ({ name: b.name, pos: [b.position.x, b.position.y, b.position.z].map((v) => +v.toFixed(1)), box: worldBoxOf(b) })),
      gridWorld: worldBoxOf(grid),
    };
    let meshesBefore = 0;
    scene.traverse((o) => { if (o.isMesh) meshesBefore++; });
    info.meshesBefore = meshesBefore;

    const newId = () => crypto.randomUUID();
    const deep = (o) => JSON.parse(JSON.stringify(o));
    const buildChildren = (obj) => (obj.children || [])
      .filter((k) => k.data)
      .map((k) => ({ id: newId(), data: deep(k.data), children: buildChildren(k) }));
    const src = blocks[0];
    const data = deep(src.data);
    data.position = [data.position[0], data.position[1], data.position[2] + 90]; // richting van het zusterblok voorbij
    data.name = 'gh-theater-kloon';
    const op = { path: [], type: 7, id: newId(), parent: grid.uuid, localIndex: grid.children.length, data, children: buildChildren(src) };
    try {
      scene.updateTreeByOp(op, app._sharedAssetsManager);
      info.added = true;
    } catch (e) { info.addError = e.message; }
    if (app.requestRender) app.requestRender();

    let meshesAfter = 0;
    scene.traverse((o) => { if (o.isMesh) meshesAfter++; });
    info.meshesAfter = meshesAfter;
    const kloon = scene.find(op.id) || null;
    info.kloonInGraph = !!kloon;
    if (kloon) {
      info.kloonBox = worldBoxOf(kloon);
      info.kloonVisible = kloon.visible;
      // projecteer het midden naar schermcoördinaten
      const c = info.kloonBox;
      const mid = { x: (c.min[0] + c.max[0]) / 2, y: (c.min[1] + c.max[1]) / 2, z: (c.min[2] + c.max[2]) / 2 };
      const cam = app._camera;
      cam.updateMatrixWorld(true);
      const v = { ...mid };
      // handmatige project: view * proj
      const e = cam.matrixWorldInverse ? (cam.updateMatrixWorld(true), cam.matrixWorldInverse.elements) : null;
      info.camType = cam.type;
      try {
        const THREEv = new (Object.getPrototypeOf(kloon.position).constructor)(mid.x, mid.y, mid.z);
        THREEv.project(cam);
        info.screen = [Math.round((THREEv.x + 1) / 2 * 1800), Math.round((1 - THREEv.y) / 2 * 1000)];
      } catch (err) { info.projErr = err.message; }
    }
    return info;
  });
  console.log(JSON.stringify(res, null, 1));
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: 'scene-inspection/ghclone4-after.png', timeout: 120000 });
} finally {
  await browser.close();
  server.kill();
}
