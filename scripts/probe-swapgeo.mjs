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

  const src = await page.evaluate(() => String(window.__app.swapGeometry).slice(0, 1200));
  console.log('swapGeometry source:', src);

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
    // gedeelde vlak-geometrie zoeken + gestrekte kloon maken
    let shared = null, sample = null;
    scene.traverse((g) => {
      if (shared || !/NBC logo's pilaar/i.test(g.name || '')) return;
      const r = (g.children || []).find((c) => c.isMesh);
      if (r) { shared = r.geometry; sample = r; }
    });
    if (!shared) return 'geen vlak';
    shared.computeBoundingBox();
    const bb = shared.boundingBox;
    const ymin = bb.min.y, ymax = bb.max.y, range = ymax - ymin;
    // wereld: [2.9, 42.9] → doel [0.5, 84.5] (net binnen de pilaar)
    const clone = shared.clone();
    const pos = clone.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const t = (pos.getY(v) - ymin) / range;
      const worldT = (t * 84.0 + 0.5 - 2.9) / 40.1; // (doelwereld - w0)/spanw
      pos.setY(v, ymin + worldT * range);
    }
    pos.needsUpdate = true;
    clone.computeBoundingBox(); clone.computeBoundingSphere();
    let n = 0;
    scene.traverse((g) => {
      if (!/NBC logo's pilaar/i.test(g.name || '')) return;
      for (const r of (g.children || [])) {
        if (!r.isMesh) continue;
        r.geometry = clone;
        const m = Array.isArray(r.material) ? r.material[0] : r.material;
        if (m) m.needsUpdate = true;
        n++;
      }
    });
    if (app.requestRender) app.requestRender();
    return { n };
  });
  console.log(JSON.stringify(rep));
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: 'scene-inspection/probe-geoswap.png' });
  console.log('OK: scene-inspection/probe-geoswap.png');
} finally {
  await browser.close();
  server.kill();
}
