// Kloontest 7 (beslissend): 8 stoelenrijen midden in de open Grand Hall
// toevoegen via het datakanaal + expandInstanceChildren → zichtbaar?
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
  await page.screenshot({ path: 'scene-inspection/ghclone8-before.png', timeout: 120000 });

  const res = await page.evaluate(() => {
    const app = window.__app;
    const scene = app._scene;
    const sam = app._sharedAssetsManager;
    let grid = null;
    scene.traverse((o) => { if (!grid && (o.name || '') === 'Stoelen Grid podium') grid = o; });
    const block = grid.children.find((c) => /Stoelen 10x10/.test(c.name || ''));
    const rij = block.children[0];
    const info = { rijLocal: [rij.position.x, rij.position.y, rij.position.z] };

    // wereld → lokaal (t.o.v. block-parent) via matrixWorld-inverse van block
    block.updateWorldMatrix(true, false);
    const inv = block.matrixWorld.clone().invert();

    const count = () => { let m = 0; scene.traverse((o) => { if (o.isMesh) m++; }); return m; };
    info.m0 = count();
    const added = [];
    // 8 rijen op een rasterpatroon midden in de hal (wereld z 420..560)
    const V = Object.getPrototypeOf(rij.position).constructor;
    for (let i = 0; i < 8; i++) {
      const world = new V(730, -30, 420 + i * 20);
      const local = world.clone().applyMatrix4(inv);
      const data = JSON.parse(JSON.stringify(rij.data));
      data.name = 'gh-theater-rij-' + i;
      data.position = [local.x, local.y, local.z];
      const op = { path: [], type: 7, id: crypto.randomUUID(), parent: block.uuid, localIndex: block.children.length, data, children: [] };
      try {
        scene.updateTreeByOp(op, sam);
        const node = scene.find(op.id);
        if (node && typeof node.expandInstanceChildren === 'function') {
          node.expandInstanceChildren({ scene, shared: sam });
        }
        added.push(op.id);
      } catch (e) { info['err' + i] = e.message; }
    }
    info.m1 = count();
    info.added = added.length;
    if (app.requestRender) app.requestRender();
    return info;
  });
  console.log(JSON.stringify(res, null, 1));
  // camera de hal in: recht boven de nieuwe rijen, schuin er naar toe kijkend
  await page.evaluate(() => {
    const app = window.__app;
    const cam = app._camera;
    cam.position.set(726, 120, 750);
    cam.lookAt(730, -30, 470);
    cam.updateMatrixWorld(true);
    if (app._controls && app._controls.target && app._controls.target.set) {
      app._controls.target.set(730, -30, 470);
      if (app._controls.update) app._controls.update();
    }
    if (app.requestRender) app.requestRender();
  });
  await new Promise((r) => setTimeout(r, 3000));
  await page.screenshot({ path: 'scene-inspection/ghclone8-after.png', timeout: 120000 });
  console.log('screenshots klaar');
} finally {
  await browser.close();
  server.kill();
}
