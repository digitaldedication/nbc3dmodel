// Kloontest 2: stoelenblok toevoegen via het Spline-datakanaal
// (scene.updateTreeByOp, op-type 7 = object toevoegen).
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
  await page.screenshot({ path: 'scene-inspection/ghclone3-before.png', timeout: 120000 });

  const res = await page.evaluate(() => {
    const app = window.__app;
    const scene = app._scene;
    const info = {
      hasUpdateTreeByOp: typeof scene.updateTreeByOp === 'function',
      hasFind: typeof scene.find === 'function',
    };
    let grid = null;
    scene.traverse((o) => { if (!grid && (o.name || '') === 'Stoelen Grid podium') grid = o; });
    if (!grid) return { ...info, fail: 'grid niet gevonden' };
    const block = grid.children.find((c) => /Stoelen 10x10/.test(c.name || ''));
    if (!block) return { ...info, fail: 'blok niet gevonden' };
    info.blockDataKeys = block.data ? Object.keys(block.data) : null;
    info.blockId = block.id || null;
    info.blockUuid = block.uuid || null;
    info.dataHasId = !!(block.data && block.data.id);
    info.findByUuid = info.hasFind ? !!scene.find(block.uuid) : null;

    if (!info.hasUpdateTreeByOp || !info.hasFind) return info;

    // ids in de drie graph zijn de spline-ids? probeer find met uuid van parent
    const parentFound = scene.find(grid.uuid);
    info.parentFindOk = !!parentFound;

    const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
    const deep = (o) => JSON.parse(JSON.stringify(o));
    const buildChildren = (obj) => (obj.children || [])
      .filter((k) => k.data)
      .map((k) => ({ id: newId(), data: deep(k.data), children: buildChildren(k) }));

    const data = deep(block.data);
    // verplaats de kopie: positie in data?
    info.dataPosition = data.position || null;
    info.dataHiddenMatrix = Array.isArray(data.hiddenMatrix) ? data.hiddenMatrix.slice(12, 15) : null;
    if (data.position && Array.isArray(data.position)) {
      data.position = [data.position[0] + 120, data.position[1], data.position[2]];
    } else if (Array.isArray(data.hiddenMatrix)) {
      data.hiddenMatrix = [...data.hiddenMatrix];
      data.hiddenMatrix[12] += 120;
    }
    const op = {
      path: [],
      type: 7,
      id: newId(),
      parent: grid.uuid,
      localIndex: grid.children.length,
      data,
      children: buildChildren(block),
    };
    try {
      scene.updateTreeByOp(op, { shared: app._sharedAssetsManager, scene });
      if (app.requestRender) app.requestRender();
      info.added = true;
    } catch (e) {
      info.addError = e.message;
      // tweede poging: context = alleen shared assets manager
      try {
        scene.updateTreeByOp(op, app._sharedAssetsManager);
        if (app.requestRender) app.requestRender();
        info.addedSecondTry = true;
      } catch (e2) { info.addError2 = e2.message; }
    }
    return info;
  });
  console.log(JSON.stringify(res, null, 1));
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: 'scene-inspection/ghclone3-after.png', timeout: 120000 });
} finally {
  await browser.close();
  server.kill();
}
