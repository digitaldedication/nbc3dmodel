import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0,300)));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE:', m.text().slice(0,300)); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 8000));

  const rep = await page.evaluate(async () => {
    const app = window.__app;
    const scene = app._scene;
    const { listImageAssets, swapHolderImage, findGrandHallPlane } = await import('/src/branding.js');
    const assets = listImageAssets(app).filter((a) => /logo pilaar/i.test(a.name || ''));
    const ghInfo = findGrandHallPlane(app, assets);
    if (!ghInfo || !ghInfo.holder) return 'geen gh-holder';
    const ghAsset = assets.find((a) => a.holder === ghInfo.holder);
    const c = document.createElement('canvas');
    c.width = (ghAsset && ghAsset.width) || 426; c.height = (ghAsset && ghAsset.height) || 191;
    const g = c.getContext('2d');
    for (let x = 0; x < c.width; x += 2) {
      const hue = (x / c.width) * 300;
      const grad = g.createLinearGradient(0, 0, 0, c.height);
      grad.addColorStop(0, `hsl(${hue},100%,80%)`);
      grad.addColorStop(1, `hsl(${hue},100%,25%)`);
      g.fillStyle = grad; g.fillRect(x, 0, 2, c.height);
    }
    swapHolderImage(ghInfo.holder, c);

    // texture-transform neutraliseren op de holder-texture(s)
    const texs = [];
    const seen = new Set();
    const scan = (v, d) => {
      if (!v || typeof v !== 'object' || d > 6 || seen.has(v)) return;
      seen.add(v);
      if (v.isTexture) { texs.push(v); return; }
      if (v instanceof Map) { for (const x of v.values()) scan(x, d + 1); return; }
      if (Array.isArray(v)) { for (const x of v) scan(x, d + 1); return; }
      for (const k of Object.keys(v)) { if (k === 'shared' || k === 'thisContext') continue; scan(v[k], d + 1); }
    };
    scan(ghInfo.holder._cache, 0);
    for (const t of texs) {
      t.rotation = 0;
      if (t.repeat) t.repeat.set(1, 1);
      if (t.offset) t.offset.set(0, 0);
      t.matrixAutoUpdate = true;
      if (t.updateMatrix) t.updateMatrix();
    }

    const { setupGrandHallScreen } = await import('/src/branding.js');
    const res = setupGrandHallScreen(app, { mode: 'zwart', planeInfo: ghInfo });
    if (app.requestRender) app.requestRender();
    await new Promise((r) => setTimeout(r, 2500));
    const pm = Array.isArray(ghInfo.plane.material) ? ghInfo.plane.material[0] : ghInfo.plane.material;
    const ls = (pm.layers && (pm.layers.layers || pm.layers)) || [];
    const dump = ls.map((l) => {
      const u = l.uniforms || {};
      const o = {};
      for (const k of Object.keys(u)) {
        const v = u[k] && u[k].value;
        if (v && v.isMatrix3) o[k] = v.elements.map((e) => +(+e).toFixed(3));
        else if (v && v.isVector2) o[k] = [v.x, v.y];
        else if (v == null || typeof v !== 'object') o[k] = v;
      }
      return { type: l.type || (l.data && l.data.type), u: o };
    });
    return { ok: true, res, texs: texs.length, dump };
  });
  console.log(JSON.stringify(rep));
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: 'scene-inspection/probe-ghwindow.png' });
  console.log('OK: scene-inspection/probe-ghwindow.png');
} finally {
  await browser.close();
  server.kill();
}
