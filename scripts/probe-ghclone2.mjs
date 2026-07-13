// Kloontest: kopieer een 10x10-stoelenblok in de Grand Hall en verplaats de
// kopie — verschijnt hij in de render? (Bepaalt of we een volledige
// theateropstelling programmatisch kunnen bouwen.)
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
  page.on('console', (m) => console.log('[page]', m.text().slice(0, 300)));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: 'scene-inspection/ghclone-before.png', timeout: 120000 });

  const res = await page.evaluate(() => {
    const app = window.__app;
    let grid = null;
    app._scene.traverse((o) => {
      if (!grid && (o.name || '') === 'Stoelen Grid podium') grid = o;
    });
    if (!grid) return { fail: 'grid niet gevonden' };
    const block = grid.children.find((c) => /Stoelen 10x10/.test(c.name || ''));
    if (!block) return { fail: 'blok niet gevonden' };

    const cloneTree = (src) => {
      const c = Object.create(Object.getPrototypeOf(src));
      Object.assign(c, src);
      c.uuid = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
      c.parent = null;
      c.children = [];
      c.matrix = src.matrix.clone();
      c.matrixWorld = src.matrixWorld.clone();
      c.position = src.position.clone();
      c.quaternion = src.quaternion.clone();
      c.scale = src.scale.clone();
      if (src.rotation && src.rotation.clone) c.rotation = src.rotation.clone();
      if (src.modelViewMatrix) c.modelViewMatrix = src.modelViewMatrix.clone();
      if (src.normalMatrix) c.normalMatrix = src.normalMatrix.clone();
      for (const k of src.children || []) {
        const kc = cloneTree(k);
        kc.parent = c;
        c.children.push(kc);
      }
      return c;
    };
    try {
      const clone = cloneTree(block);
      clone.name = 'gh-theater-extra-test';
      clone.position.x = block.position.x + 120; // richting achterzijde hal
      clone.parent = grid;
      grid.children.push(clone);
      clone.updateMatrixWorld(true);
      if (app.requestRender) app.requestRender();
      return { ok: true, blockName: block.name, blockPos: [block.position.x, block.position.y, block.position.z] };
    } catch (e) {
      return { fail: 'clone: ' + e.message };
    }
  });
  console.log(JSON.stringify(res));
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: 'scene-inspection/ghclone-after.png', timeout: 120000 });
  console.log('screenshots: scene-inspection/ghclone-before.png / ghclone-after.png');
} finally {
  await browser.close();
  server.kill();
}
