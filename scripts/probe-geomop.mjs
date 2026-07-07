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
      g.fillStyle = '#111111'; g.fillRect(0, Math.round(c.height * 0.85), c.width, c.height);
      swapHolderImage(a.holder, c);
    }
    let n = 0, errs = [], first = null;
    const ctx = { shared: app._sharedAssetsManager, scene: app._scene };
    scene.traverse((g) => {
      if (!/NBC logo's pilaar/i.test(g.name || '')) return;
      for (const r of (g.children || [])) {
        if (!r.isMesh || !r.data) continue;
        try {
          if (!first) first = { uuid: r.uuid, hiddenMatrix: [...r.data.hiddenMatrix] };
          const hm = [...r.data.hiddenMatrix];
          hm[5] = 3.2;      // y-schaal ×3.2
          hm[13] = -12;     // y-translatie
          const l = { ...r.data, hiddenMatrix: hm };
          r.updateByOp({ type: 0, path: [], props: { hiddenMatrix: l.hiddenMatrix } }, l, ctx, false);
          // rebuild forceren via geometry-op met ONGEWIJZIGDE parameters
          const l2 = { ...r.data, geometry: { ...r.data.geometry } };
          r.updateByOp({ type: 0, path: [], props: { geometry: l2.geometry } }, l2, ctx, false);
          n++;
        } catch (e) { errs.push(e.message); }
      }
    });
    if (app.requestRender) app.requestRender();
    return { n, errs: errs.slice(0, 3), first };
  });
  console.log(JSON.stringify(rep));
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: 'scene-inspection/probe-geomop2.png' });
  console.log('OK: scene-inspection/probe-geomop2.png');
} finally {
  await browser.close();
  server.kill();
}
