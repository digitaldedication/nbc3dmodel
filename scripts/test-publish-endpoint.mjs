// Test de publiceer-route via een eigen publiceer-adres (zonder GitHub-token).
// Het adres wordt onderschept en nagebootst — zoals de Worker in worker/ —
// zodat we kunnen controleren dat de beheeromgeving een geldige config POST,
// dat de korte link het adres meekrijgt (&s=…) en dat de viewer hem laadt.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const ENDPOINT_HOST = 'configs.voorbeeld-test.workers.dev';
const WACHTWOORD = 'test-wachtwoord';

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // nagebootst publiceer-adres: POST bewaart in het geheugen, GET geeft terug
  const opslag = new Map();
  let laatstePost = null;
  await page.route(`**://${ENDPOINT_HOST}/**`, async (route) => {
    const req = route.request();
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'Content-Type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    if (req.method() === 'POST') {
      const body = JSON.parse(req.postData() || '{}');
      laatstePost = { token: body.token, key: body.key, bytes: JSON.stringify(body.config || {}).length };
      if (body.key !== WACHTWOORD) return route.fulfill({ status: 401, headers: cors, contentType: 'application/json', body: '{"error":"wachtwoord klopt niet"}' });
      opslag.set(body.token, JSON.stringify(body.config));
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: '{"ok":true}' });
    }
    const token = new URL(req.url()).searchParams.get('e');
    const cfg = opslag.get(token);
    if (!cfg) return route.fulfill({ status: 404, headers: cors, contentType: 'application/json', body: '{"error":"niet gevonden"}' });
    return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: cfg });
  });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|configs\.voorbeeld-test\.workers\.dev)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  page.on('pageerror', (e) => console.log('pageerror:', e.message));

  await page.goto('http://127.0.0.1:8787/nbc3dmodel/admin/');
  await new Promise((r) => setTimeout(r, 2500));

  // publiceren aanzetten, methode 'eigen adres', adres + wachtwoord invullen
  await page.evaluate(([host, wachtwoord]) => {
    const $ = (id) => document.getElementById(id);
    const zet = (id, waarde) => { const el = $(id); if (el.type === 'checkbox') el.checked = waarde; else el.value = waarde; el.dispatchEvent(new Event('change', { bubbles: true })); };
    zet('pub-aan', true);
    zet('pub-methode', 'endpoint');
    zet('pub-endpoint', 'https://' + host + '/');
    zet('pub-wachtwoord', wachtwoord);
  }, [ENDPOINT_HOST, WACHTWOORD]);
  const zichtbaar = await page.evaluate(() => ({
    endpointVelden: getComputedStyle(document.getElementById('pub-endpoint-velden')).display,
    githubVelden: getComputedStyle(document.getElementById('pub-github')).display,
  }));
  console.log('velden — eigen adres:', zichtbaar.endpointVelden, '| github:', zichtbaar.githubVelden);

  await page.evaluate(() => { document.getElementById('eventName').value = 'Endpoint-test'; });
  await page.click('#save');
  await new Promise((r) => setTimeout(r, 3000));

  const info = await page.evaluate(() => {
    const ev = (JSON.parse(localStorage.getItem('nbc3d-events-v1') || '[]'))[0];
    return {
      token: ev && ev.token,
      published: ev && ev.published,
      ref: ev && ev.ref,
      openHref: document.querySelector('#events a.btn')?.href || null,
      toast: document.getElementById('toast').textContent,
    };
  });
  console.log('POST ontvangen:', laatstePost && `token=${laatstePost.token} bytes=${laatstePost.bytes} wachtwoord-ok=${laatstePost.key === WACHTWOORD}`);
  console.log('event gepubliceerd:', info.published, '| adres in event:', info.ref);
  console.log('korte link:', info.openHref, '| lengte:', info.openHref && info.openHref.length);
  console.log('melding:', info.toast);

  // het wachtwoord mag nooit in het opgeslagen event of de link zitten
  const lek = await page.evaluate((w) => {
    const opgeslagen = localStorage.getItem('nbc3d-events-v1') || '';
    const link = document.querySelector('#events a.btn')?.href || '';
    return opgeslagen.includes(w) || link.includes(w);
  }, WACHTWOORD);
  console.log('wachtwoord lekt in event of link:', lek);

  // korte link openen: de viewer moet de config van het adres halen
  await page.goto(info.openHref);
  const ok = await page.waitForSelector('#status.hidden', { timeout: 240000 }).then(() => true).catch(() => false);
  const err = await page.evaluate(() => { const e = document.querySelector('#status .err'); return e && e.textContent.trim(); });
  const badge = await page.evaluate(() => document.getElementById('badge').textContent.trim());
  console.log('korte link rendert:', ok, '| badge:', JSON.stringify(badge), '| fout:', err || '(geen)');

  // onbekend token op hetzelfde adres → nette melding, geen vastloper
  await page.goto(`http://127.0.0.1:8787/nbc3dmodel/viewer/?e=bestaatniet123&s=${ENDPOINT_HOST}`);
  await new Promise((r) => setTimeout(r, 2500));
  const err2 = await page.evaluate(() => { const e = document.querySelector('#status .err'); return e && e.textContent.trim().slice(0, 90); });
  console.log('onbekend token toont:', JSON.stringify(err2));
} finally {
  await browser.close();
  server.kill();
}
