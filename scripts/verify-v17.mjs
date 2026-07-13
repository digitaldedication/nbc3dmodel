// Verificatie van de v17-aanpassingen: standaard-tooltips, allowSwitch uit,
// aparte logo's voor Event Hall-wand en Grand Hall-middenscherm, decorlijst.
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

// testlogo's: fel gekleurde blokken met letter, goed te onderscheiden
function logoDataUri(pageCtx) { /* in de browser gemaakt */ }

try {
  const page = await browser.newPage({ viewport: { width: 1680, height: 1100 } });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  page.on('pageerror', (e) => console.log('pageerror:', e.message));

  await page.goto('http://127.0.0.1:8787/admin/');
  await page.waitForSelector('#tooltip-toggles input[type=checkbox]', { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1500));

  // 1. standaardstatussen controleren
  const state = await page.evaluate(() => {
    const toggles = {};
    for (const cb of document.querySelectorAll('#tooltip-toggles input[type=checkbox]')) {
      toggles[cb.dataset.key] = cb.checked;
    }
    const decorOptions = [...document.querySelectorAll('#eh-decor option')].map((o) => ({
      value: o.value, text: o.textContent, disabled: o.disabled,
    }));
    return {
      allowSwitch: document.getElementById('allowSwitch').checked,
      toggles,
      decorOptions,
      hasEhLogoInput: !!document.getElementById('logo-eventhall'),
      hasGhLogoInput: !!document.getElementById('logo-grandhall'),
    };
  });
  console.log('== formulierstatus ==');
  console.log(JSON.stringify(state, null, 1));

  // 2. logo's uploaden: hoofdlogo (rood A), EH-logo (groen E), GH-logo (blauw G)
  const mk = async (letter, color) => page.evaluate(([letter, color]) => {
    const c = document.createElement('canvas');
    c.width = 400; c.height = 200;
    const g = c.getContext('2d');
    g.fillStyle = color; g.fillRect(0, 0, 400, 200);
    g.fillStyle = '#fff'; g.font = '900 160px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(letter, 200, 105);
    return c.toDataURL('image/png');
  }, [letter, color]);
  const setFile = async (id, dataUri, name) => {
    const buf = Buffer.from(dataUri.split(',')[1], 'base64');
    await page.setInputFiles('#' + id, { name, mimeType: 'image/png', buffer: buf });
  };
  await setFile('logo', await mk('A', '#a0006e'), 'hoofdlogo.png');
  await setFile('logo-eventhall', await mk('E', '#00701f'), 'eh-logo.png');
  await setFile('logo-grandhall', await mk('G', '#0033bb'), 'gh-logo.png');
  await page.evaluate(() => document.querySelector('aside').dispatchEvent(new Event('change')));

  // 3. config controleren die naar de preview gaat (wachten tot de logo's
  //    erin zitten; de zware scene-render in het iframe kan de debounce
  //    van de preview flink vertragen)
  await page.waitForFunction(() => {
    try {
      const c = JSON.parse(sessionStorage.getItem('nbc3d-preview') || 'null');
      return !!(c && c.logo && c.eventhall && c.eventhall.logoImage && c.grandhall && c.grandhall.logoImage);
    } catch { return false; }
  }, null, { timeout: 120000 });
  const cfg = await page.evaluate(() => {
    const raw = sessionStorage.getItem('nbc3d-preview');
    const c = raw ? JSON.parse(raw) : null;
    if (!c) return null;
    return {
      hiddenTooltips: c.hiddenTooltips || [],
      scenes: c.scenes || null,
      ehLogoImage: !!(c.eventhall && c.eventhall.logoImage),
      ghLogoImage: !!(c.grandhall && c.grandhall.logoImage),
      logo: !!c.logo,
    };
  });
  console.log('== preview-config ==');
  console.log(JSON.stringify(cfg, null, 1));

  // 4. wachten op de preview-render en screenshot
  await page.waitForFunction(() => {
    const f = document.getElementById('frame');
    try {
      const s = f.contentDocument && f.contentDocument.getElementById('status');
      return s && s.classList.contains('hidden');
    } catch { return false; }
  }, null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: 'scene-inspection/verify-v17-admin.png', timeout: 120000 });
  console.log('screenshot: scene-inspection/verify-v17-admin.png');
} finally {
  await browser.close();
  server.kill();
}
