// Kloontest 6: instance toevoegen + zelf expanderen (expandInstanceChildren /
// recomputeInstances) → renderen de stoelen dan?
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
    const sam = app._sharedAssetsManager;
    let grid = null;
    scene.traverse((o) => { if (!grid && (o.name || '') === 'Stoelen Grid podium') grid = o; });
    const block = grid.children.find((c) => /Stoelen 10x10/.test(c.name || ''));
    const rij = block.children[0];
    const info = {};

    const data = JSON.parse(JSON.stringify(rij.data));
    data.name = 'gh-kloon-rij';
    data.position = [data.position[0], data.position[1], data.position[2] + 30];
    const op = { path: [], type: 7, id: crypto.randomUUID(), parent: block.uuid, localIndex: block.children.length, data, children: [] };
    try { scene.updateTreeByOp(op, sam); info.added = true; }
    catch (e) { info.addError = e.message; return info; }

    const kloon = scene.find(op.id);
    info.kloonCtor = kloon && kloon.constructor.name;
    info.isInstanceRoot = kloon && kloon.isInstanceRoot;
    info.hasExpand = kloon && typeof kloon.expandInstanceChildren === 'function';

    const count = () => { let m = 0; scene.traverse((o) => { if (o.isMesh) m++; }); return m; };
    info.m0 = count();
    if (info.hasExpand) {
      try {
        kloon.expandInstanceChildren({ scene, shared: sam });
        info.expandOk = true;
      } catch (e) { info.expandErr = e.message; }
    }
    info.m1 = count();
    if (info.m1 === info.m0 && typeof scene.recomputeInstances === 'function') {
      try {
        scene.markNeedsRecomputeInstances();
        scene.recomputeInstances(sam);
        info.recomputeOk = true;
      } catch (e) { info.recomputeErr = e.message; }
      info.m2 = count();
    }
    if (app.requestRender) app.requestRender();
    info.kloonChildren = kloon ? kloon.children.length : null;
    return info;
  });
  console.log(JSON.stringify(res, null, 1));
  await new Promise((r) => setTimeout(r, 3000));
  await page.screenshot({ path: 'scene-inspection/ghclone7-after.png', timeout: 120000 });
  // crop GH
  console.log('screenshot: scene-inspection/ghclone7-after.png');
} finally {
  await browser.close();
  server.kill();
}
