import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('scene-inspection/orig-tex', { recursive: true });
const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });

  const dumps = await page.evaluate(() => {
    const app = window.__app;
    const cache = app._sharedAssetsManager.imageHolderCache.cache;
    const holders = cache instanceof Map ? [...cache.values()] : Object.values(cache);
    const out = [];
    for (const h of holders) {
      const name = h.name || (h.data && h.data.name) || '';
      if (!/event hall scherm|logo pilaar/i.test(name)) continue;
      const img = h.img;
      if (!img || !img.width) continue;
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      out.push({ name, dataUrl: c.toDataURL('image/png') });
    }
    return out;
  });
  for (const d of dumps) {
    const safe = d.name.replace(/[^a-z0-9]+/gi, '_').slice(0, 60);
    writeFileSync(`scene-inspection/orig-tex/${safe}.png`, Buffer.from(d.dataUrl.split(',')[1], 'base64'));
    console.log('dumped:', d.name);
  }
} finally {
  await browser.close();
  server.kill();
}
