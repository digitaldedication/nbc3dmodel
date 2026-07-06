import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

mkdirSync('scene-inspection', { recursive: true });
const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

// Demo-config zoals de beheerpagina die genereert (kleuren, naam, geen logo-upload)
const config = {
  eventName: 'ACME Kickoff 2026',
  colors: { primary: '#E4032E', secondary: '#1B2A7B' },
  scene: 'congres',
  lights: false,
};
const b64 = Buffer.from(JSON.stringify(config)).toString('base64url');

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
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 200)); });

  await page.goto(`http://127.0.0.1:8787/viewer/#c=${b64}`);
  await page.waitForSelector('#status.hidden', { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: 'scene-inspection/viewer-branded.png' });
  console.log('OK: scene-inspection/viewer-branded.png');

  // wissel naar een andere scène via de knoppenbalk
  // (dispatchEvent i.p.v. click: Playwright's stabiliteitscheck is te traag
  //  bij software-WebGL-rendering)
  await page.dispatchEvent('#scenes button[data-key="feest"]', 'click');
  await page.waitForSelector('#status:not(.hidden)', { timeout: 30000 }).catch(() => {});
  await page.waitForSelector('#status.hidden', { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: 'scene-inspection/viewer-branded-feest.png' });
  console.log('OK: scene-inspection/viewer-branded-feest.png');
} finally {
  await browser.close();
  server.kill();
}
