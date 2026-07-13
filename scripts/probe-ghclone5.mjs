// Kloontest 4: blokdata dumpen (cloner/component?) en add zonder children.
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
    let grid = null;
    scene.traverse((o) => { if (!grid && (o.name || '') === 'Stoelen Grid podium') grid = o; });
    const src = grid.children.find((c) => /Stoelen 10x10/.test(c.name || ''));
    const info = {};
    // compacte datadump: diepe arrays/strings inkorten
    const compact = (v, depth) => {
      if (v === null || typeof v !== 'object') {
        if (typeof v === 'string' && v.length > 60) return v.slice(0, 60) + '…';
        return v;
      }
      if (depth > 3) return Array.isArray(v) ? `[array ${v.length}]` : '{…}';
      if (Array.isArray(v)) return v.length > 8 ? `[array ${v.length}]` : v.map((x) => compact(x, depth + 1));
      const o = {};
      for (const k of Object.keys(v)) o[k] = compact(v[k], depth + 1);
      return o;
    };
    info.srcType = src.type;
    info.srcCtor = src.constructor && src.constructor.name;
    info.data = compact(JSON.parse(JSON.stringify(src.data)), 0);
    info.childTypes = src.children.map((c) => ({ name: c.name, type: c.type, hasData: !!c.data, dataType: c.data && c.data.type }));

    // poging: add zonder children
    const newId = () => crypto.randomUUID();
    const data = JSON.parse(JSON.stringify(src.data));
    data.position = [data.position[0], data.position[1], data.position[2] + 90];
    data.name = 'gh-kloon-zonder-children';
    const op = { path: [], type: 7, id: newId(), parent: grid.uuid, localIndex: grid.children.length, data, children: [] };
    let meshes0 = 0; scene.traverse((o) => { if (o.isMesh) meshes0++; });
    try { scene.updateTreeByOp(op, app._sharedAssetsManager); info.added = true; }
    catch (e) { info.addError = e.message; }
    if (app.requestRender) app.requestRender();
    let meshes1 = 0; scene.traverse((o) => { if (o.isMesh) meshes1++; });
    info.meshDelta = meshes1 - meshes0;
    const kloon = scene.find(op.id);
    info.kloonChildren = kloon ? kloon.children.length : null;
    return info;
  });
  console.log(JSON.stringify(res, null, 1));
  await new Promise((r) => setTimeout(r, 3500));
  const res2 = await page.evaluate(() => {
    let meshes = 0;
    window.__app._scene.traverse((o) => { if (o.isMesh) meshes++; });
    return { meshesLater: meshes };
  });
  console.log(JSON.stringify(res2));
  await page.screenshot({ path: 'scene-inspection/ghclone5-after.png', timeout: 120000 });
} finally {
  await browser.close();
  server.kill();
}
