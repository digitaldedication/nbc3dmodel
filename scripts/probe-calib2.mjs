import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const S = parseFloat(process.argv[2] || '8.55');
const T = parseFloat(process.argv[3] || '-3');

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
  await new Promise((r) => setTimeout(r, 9000));

  const rep = await page.evaluate(async ({ S, T }) => {
    const app = window.__app;
    const scene = app._scene;
    const { listImageAssets, swapHolderImage } = await import('/src/branding.js');
    const opCtx = { shared: app._sharedAssetsManager, scene };
    // rotated content: groen met magenta strook aan de beeld-boven (canvas-links)
    const assets = listImageAssets(app).filter((a) => /logo pilaar/i.test(a.name || ''));
    for (const a of assets) {
      const c = document.createElement('canvas');
      c.width = a.width || 426; c.height = a.height || 191;
      const g = c.getContext('2d');
      g.fillStyle = '#00ff00'; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#ff00ff'; g.fillRect(0, 0, Math.round(c.width * 0.06), c.height);
      swapHolderImage(a.holder, c);
    }
    let n = 0;
    scene.traverse((group) => {
      if (!/NBC logo's pilaar/i.test(group.name || '')) return;
      for (const r of (group.children || [])) {
        if (!r.isMesh || !r.data || !Array.isArray(r.data.hiddenMatrix)) continue;
        try {
          const hm = [...r.data.hiddenMatrix];
          hm[5] = S; hm[13] = T;
          const l = { ...r.data, hiddenMatrix: hm };
          r.updateByOp({ type: 0, path: [], props: { hiddenMatrix: l.hiddenMatrix } }, l, opCtx, false);
          const l2 = { ...r.data, geometry: { ...r.data.geometry } };
          r.updateByOp({ type: 0, path: [], props: { geometry: l2.geometry } }, l2, opCtx, false);
          n++;
        } catch (e) { /* skip */ }
      }
    });
    if (app.requestRender) app.requestRender();
    return { n };
  }, { S, T });
  console.log(JSON.stringify(rep));
  await new Promise((r) => setTimeout(r, 5000));
  await page.screenshot({ path: 'scene-inspection/probe-calib2.png' });
  console.log(`OK s=${S} t=${T}`);
} finally {
  await browser.close();
  server.kill();
}
