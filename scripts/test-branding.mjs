import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const key = process.argv[2] || 'congres';
mkdirSync('scene-inspection', { recursive: true });

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
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
  page.on('pageerror', (e) => console.log('pageerror:', e.message));

  await page.goto(`http://127.0.0.1:8787/scripts/test-branding.html?scene=${encodeURIComponent(`/assets/spline/${key}/scene.splinecode`)}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  const err = await page.evaluate('window.__error || null');
  if (err) { console.log('ERROR:', err); process.exit(1); }

  console.log('assets:', JSON.stringify(await page.evaluate('window.__assets'), null, 1));
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `scene-inspection/${key}-before.png` });

  await page.evaluate('window.__applyBranding()');
  await page.waitForFunction('window.__branded === true', null, { timeout: 60000 });
  const rep = await page.evaluate('window.__brandReport');
  console.log('brandReport:', JSON.stringify({ ...rep, swapped: rep.swapped.length, skipped: rep.skipped.length }));
  await new Promise((r) => setTimeout(r, 15000));
  await page.screenshot({ path: `scene-inspection/${key}-after.png` });

  // hal-toggles: Event Hall en Grand Hall opstelling uit
  await page.evaluate('window.__applyBranding({ halls: { eventhall: false, grandhall: false } })');
  await page.waitForFunction('window.__branded === true', null, { timeout: 60000 });
  console.log('halls:', JSON.stringify(await page.evaluate('window.__brandReport.halls')));
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `scene-inspection/${key}-halls-off.png` });
  console.log('screenshots: scene-inspection/' + key + '-{before,after,halls-off}.png');
} finally {
  await browser.close();
  server.kill();
}
