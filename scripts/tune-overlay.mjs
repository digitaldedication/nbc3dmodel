import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

mkdirSync('scene-inspection', { recursive: true });
const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const variants = JSON.parse(process.argv[2] || '[{"scale":8,"dy":28,"dz":-6}]');
  for (const [i, v] of variants.entries()) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    await page.route('**://www.gstatic.com/draco/**', (route) => {
      const file = route.request().url().split('/').pop();
      route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${file}` }).catch(() => route.abort());
    });
    await page.route('**://unpkg.com/@splinetool/**', (route) => {
      const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/);
      if (!m) return route.abort();
      route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort());
    });
    await page.goto(`http://127.0.0.1:8787/scripts/test-branding.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
    await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
    await page.evaluate(`window.__applyBranding({ grandHallLogoTransform: ${JSON.stringify(v)} })`);
    await page.waitForFunction('window.__branded === true', null, { timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2500));
    const clip = v.debugCenter ? undefined : { x: 300, y: 180, width: 320, height: 160 };
    await page.screenshot({ path: `scene-inspection/overlay-${i}.png`, clip });
    console.log(`variant ${i}:`, JSON.stringify(v), '→ scene-inspection/overlay-' + i + '.png');
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
