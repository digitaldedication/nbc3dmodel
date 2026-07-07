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
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 8000));

  const keys = await page.evaluate(() => {
    const scene = window.__app._scene;
    let plane = null;
    scene.traverse((g) => { if (!plane && /NBC logo's pilaar/i.test(g.name || '')) plane = (g.children || []).find((c) => c.isMesh); });
    if (!plane || !plane.data) return 'geen data';
    const d = plane.data;
    const shallow = {};
    for (const k of Object.keys(d)) {
      const v = d[k];
      shallow[k] = (v && typeof v === 'object') ? (Array.isArray(v) ? `array(${v.length})` : JSON.stringify(v).slice(0, 120)) : v;
    }
    return { hasUpdateByOp: typeof plane.updateByOp === 'function', shallow };
  });
  console.log(JSON.stringify(keys, null, 1));

  const rep = await page.evaluate(async () => {
    const app = window.__app;
    const scene = app._scene;
    const { listImageAssets, swapHolderImage } = await import('/src/branding.js');
    const assets = listImageAssets(app).filter((a) => a.name && /logo pilaar/i.test(a.name));
    for (const a of assets) {
      const c = document.createElement('canvas');
      c.width = a.width || 426; c.height = a.height || 191;
      const g = c.getContext('2d');
      g.fillStyle = '#00cc44'; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#ff00ff'; g.fillRect(0, 0, c.width, Math.round(c.height * 0.15));
      swapHolderImage(a.holder, c);
    }
    let n = 0; let err = null;
    scene.traverse((g) => {
      if (!/NBC logo's pilaar/i.test(g.name || '')) return;
      for (const r of (g.children || [])) {
        if (!r.isMesh || !r.data || typeof r.updateByOp !== 'function') continue;
        try {
          const sc = Array.isArray(r.data.scale) ? r.data.scale : [1, 1, 1];
          const newScale = [sc[0], sc[1] * 2, sc[2]];
          const l = { ...r.data, scale: newScale };
          r.updateByOp({ type: 0, path: [], props: { scale: l.scale } }, l, { shared: app._sharedAssetsManager, scene: app._scene }, false);
          n++;
        } catch (e) { err = err || e.message; }
      }
    });
    if (app.requestRender) app.requestRender();
    return { n, err };
  });
  console.log(JSON.stringify(rep));
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: 'scene-inspection/probe-updatebyop.png' });
  console.log('OK: scene-inspection/probe-updatebyop.png');
} finally {
  await browser.close();
  server.kill();
}
