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
  const page = await browser.newPage({ viewport: { width: 1680, height: 950 } });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => {
    if (/picsum\.photos/.test(r.request().url())) {
      const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      return r.fulfill({ contentType: 'image/png', body: png1x1 });
    }
    r.abort();
  });
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

  await page.goto('http://127.0.0.1:8787/nbc3dmodel/admin/');
  await page.fill('#eventName', 'ACME Kickoff 2026');
  await page.setInputFiles('#logo', 'scene-inspection/testlogo.png');
  await page.evaluate(() => { document.querySelector('input[name=scene][value=feest]').checked = true; });
  await page.evaluate(() => { document.getElementById('hall-grandhall').checked = false; });
  await page.evaluate(() => document.querySelector('aside').dispatchEvent(new Event('change')));

  // wacht tot de preview-iframe de scène geladen heeft
  await page.waitForFunction(() => {
    const f = document.getElementById('frame');
    try {
      const s = f.contentDocument && f.contentDocument.getElementById('status');
      return s && s.classList.contains('hidden');
    } catch { return false; }
  }, null, { timeout: 120000 }).catch(async (e) => {
    await page.screenshot({ path: 'scene-inspection/admin-debug.png' });
    const info = await page.evaluate(() => {
      const f = document.getElementById('frame');
      try { return { src: f.src, status: f.contentDocument && f.contentDocument.getElementById('status') && f.contentDocument.getElementById('status').textContent }; }
      catch (err) { return { src: f.src, err: String(err) }; }
    });
    console.log('DEBUG iframe:', JSON.stringify(info));
    throw e;
  });
  await new Promise((r) => setTimeout(r, 3000));

  await page.dispatchEvent('#save', 'click');
  await new Promise((r) => setTimeout(r, 1500));
  const toasts = await page.evaluate(() => [...document.querySelectorAll('.toast, #toasts *')].map((t) => t.textContent).slice(0, 5));
  if (toasts.length) console.log('toasts:', JSON.stringify(toasts));
  const events = await page.evaluate(() => JSON.parse(localStorage.getItem('nbc3d-events-v1') || '[]').map((e) => ({ name: e.name, token: e.token, scene: e.config.scene })));
  console.log('opgeslagen events:', JSON.stringify(events));

  await page.screenshot({ path: 'scene-inspection/admin.png' });
  console.log('OK: scene-inspection/admin.png');
} finally {
  await browser.close();
  server.kill();
}
