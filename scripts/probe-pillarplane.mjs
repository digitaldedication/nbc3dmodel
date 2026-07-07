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
      // kwadranten: LB=cyaan LO=magenta RB=geel RO=zwart + rode rand boven
      const w = c.width, h = c.height;
      g.fillStyle = '#00ffff'; g.fillRect(0, 0, w / 2, h / 2);
      g.fillStyle = '#ffff00'; g.fillRect(w / 2, 0, w / 2, h / 2);
      g.fillStyle = '#ff00ff'; g.fillRect(0, h / 2, w / 2, h / 2);
      g.fillStyle = '#222222'; g.fillRect(w / 2, h / 2, w / 2, h / 2);
      g.fillStyle = '#ff0000'; g.fillRect(0, 0, w, Math.round(h * 0.08));
      swapHolderImage(a.holder, c);
    }
    let pillars = 0, hiddenPlanes = 0;
    scene.traverse((g) => {
      if (!/NBC logo's pilaar/i.test(g.name || '')) return;
      const planes = (g.children || []).filter((c) => c.isMesh);
      const pillar = g.parent && (g.parent.children || []).find((s) => s.isMesh && /^Pilaar/.test(s.name || ''));
      if (!planes.length || !pillar) return;
      const pm = Array.isArray(planes[0].material) ? planes[0].material[0] : planes[0].material;
      pillar.material = pm;
      pillar.material.needsUpdate = true;
      pillars++;
      for (const p of planes) { p.visible = false; hiddenPlanes++; }
    });
    if (app.requestRender) app.requestRender();
    return { pillars, hiddenPlanes };
  });
  console.log(JSON.stringify(rep));
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: 'scene-inspection/probe-uv.png' });
  console.log('OK: scene-inspection/probe-uv.png');
} finally {
  await browser.close();
  server.kill();
}
