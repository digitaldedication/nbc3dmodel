import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

mkdirSync('scene-inspection', { recursive: true });
const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

// Demo-config zoals de beheerpagina die genereert
const config = {
  eventName: 'ACME Kickoff 2026',
  colors: { primary: '#E4032E', secondary: '#1B2A7B' },
  scene: 'congres',
  halls: { eventhall: true, grandhall: false },
};
const b64 = Buffer.from(JSON.stringify(config)).toString('base64url');

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => {
    // picsum-afbeeldingen (tooltipkaarten) lokaal niet beschikbaar → grijze placeholder
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
  page.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 200)); });

  // simuleer GitHub Pages-subpad
  await page.goto(`http://127.0.0.1:8787/nbc3dmodel/viewer/#c=${b64}`);
  await page.waitForSelector('#status.hidden', { timeout: 240000 });
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: 'scene-inspection/viewer-branded.png' });
  console.log('OK: scene-inspection/viewer-branded.png');

  const pills = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.style.transform.includes('translate(-50%')).length);
  console.log('tooltip-pills zichtbaar:', pills);

  // klik een info-tooltip open (Podium) en screenshot de kaart
  const clicked = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const target = btns.find((b) => b.textContent.includes('Podium')) || btns.find((b) => b.textContent.includes('Grand hall'));
    if (target) { target.dispatchEvent(new MouseEvent('click', { bubbles: true })); return target.textContent; }
    return null;
  });
  console.log('geklikt op tooltip:', clicked);
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: 'scene-inspection/viewer-tooltip-card.png' });
  console.log('OK: scene-inspection/viewer-tooltip-card.png');

  // wissel scène
  await page.dispatchEvent('#scenes button[data-key="feest"]', 'click');
  await page.waitForSelector('#status:not(.hidden)', { timeout: 30000 }).catch(() => {});
  await page.waitForSelector('#status.hidden', { timeout: 240000 });
  await new Promise((r) => setTimeout(r, 3000));
  await page.screenshot({ path: 'scene-inspection/viewer-branded-feest.png' });
  console.log('OK: scene-inspection/viewer-branded-feest.png');
} finally {
  await browser.close();
  server.kill();
}
