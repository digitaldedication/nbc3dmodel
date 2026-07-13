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

  if (process.argv[2] !== 'orig') {
  await page.evaluate(async () => {
    const app = window.__app;
    const { listImageAssets, swapHolderImage } = await import('/src/branding.js');
    const assets = listImageAssets(app).filter((a) => /logo pilaar/i.test(a.name || ''));
    for (const a of assets) {
      const c = document.createElement('canvas');
      c.width = a.width || 426; c.height = a.height || 191;
      const g = c.getContext('2d');
      // hue loopt nu over canvas-Y (0..300°)
      for (let y = 0; y < c.height; y += 2) {
        const hue = (y / c.height) * 300;
        g.fillStyle = `hsl(${hue},100%,55%)`;
        g.fillRect(0, y, c.width, 2);
      }
      swapHolderImage(a.holder, c);
    }
    if (app.requestRender) app.requestRender();
  });
  }
  await new Promise((r) => setTimeout(r, 3000));
  await page.screenshot({ path: 'scene-inspection/probe-band.png' });
  console.log('OK: scene-inspection/probe-band.png');
} finally {
  await browser.close();
  server.kill();
}
