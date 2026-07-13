// Kloontest 5: Instance-data dumpen en één rij-instance toevoegen.
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
    const block = grid.children.find((c) => /Stoelen 10x10/.test(c.name || ''));
    const rij = block.children[0]; // Component Rij Stoelen 10 Instance
    const compact = (v, depth) => {
      if (v === null || typeof v !== 'object') return typeof v === 'string' && v.length > 80 ? v.slice(0, 80) + '…' : v;
      if (depth > 4) return Array.isArray(v) ? `[array ${v.length}]` : '{…}';
      if (Array.isArray(v)) return v.length > 10 ? `[array ${v.length}]` : v.map((x) => compact(x, depth + 1));
      const o = {};
      for (const k of Object.keys(v)) o[k] = compact(v[k], depth + 1);
      return o;
    };
    const info = { rijData: compact(JSON.parse(JSON.stringify(rij.data)), 0), rijChildren: rij.children.length };

    // voeg één rij-instance toe, 20 wereld verder
    const data = JSON.parse(JSON.stringify(rij.data));
    data.name = 'gh-kloon-rij';
    data.position = [data.position[0] + 40, data.position[1], data.position[2]];
    const op = { path: [], type: 7, id: crypto.randomUUID(), parent: block.uuid, localIndex: block.children.length, data, children: [] };
    let m0 = 0; scene.traverse((o) => { if (o.isMesh) m0++; });
    try { scene.updateTreeByOp(op, app._sharedAssetsManager); info.added = true; }
    catch (e) { info.addError = e.message; }
    if (app.requestRender) app.requestRender();
    let m1 = 0; scene.traverse((o) => { if (o.isMesh) m1++; });
    info.meshDelta = m1 - m0;
    const kloon = scene.find(op.id);
    info.kloonChildren = kloon ? kloon.children.length : null;
    info.kloonType = kloon ? kloon.type : null;
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
} finally {
  await browser.close();
  server.kill();
}
