// Test de publiceer-route in de beheeromgeving: de GitHub Contents API wordt
// onderschept en nagebootst, zodat we kunnen controleren dat er een geldig
// configs/TOKEN.json wordt geschreven en dat de korte link werkt in de viewer.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
let writtenToken = null;
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // nagebootste GitHub API: GET → 404 (nieuw bestand), PUT → 201 + bestand op schijf
  await page.route('**://api.github.com/**', async (route) => {
    const req = route.request();
    const auth = req.headers()['authorization'];
    if (!auth || !/^Bearer .+/.test(auth)) {
      return route.fulfill({ status: 401, contentType: 'application/json', body: '{"message":"Bad credentials"}' });
    }
    if (req.method() === 'GET') {
      return route.fulfill({ status: 404, contentType: 'application/json', body: '{"message":"Not Found"}' });
    }
    const body = JSON.parse(req.postData() || '{}');
    const m = req.url().match(/contents\/configs\/([^?]+)\.json/);
    writtenToken = m && m[1];
    const json = Buffer.from(body.content, 'base64').toString('utf8');
    // echt wegschrijven zodat de viewer het via ?e=TOKEN kan ophalen
    writeFileSync(`configs/${writtenToken}.json`, json);
    console.log('PUT ontvangen | branch:', body.branch, '| pad: configs/' + writtenToken + '.json | bytes:', json.length);
    JSON.parse(json); // moet geldige JSON zijn
    return route.fulfill({ status: 201, contentType: 'application/json', body: '{"content":{"sha":"abc"}}' });
  });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|api\.github\.com)/, (r) => {
    if (/picsum\.photos/.test(r.request().url())) {
      return r.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64') });
    }
    r.abort();
  });
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  page.on('pageerror', (e) => console.log('pageerror:', e.message));

  await page.goto('http://127.0.0.1:8787/nbc3dmodel/admin/');
  await new Promise((r) => setTimeout(r, 2500));

  // publiceren aanzetten + sleutel invullen
  await page.evaluate(() => {
    const $ = (id) => document.getElementById(id);
    $('pub-aan').checked = true;
    $('pub-aan').dispatchEvent(new Event('change', { bubbles: true }));
    $('pub-token').value = 'github_pat_testsleutel';
    $('pub-token').dispatchEvent(new Event('change', { bubbles: true }));
    $('pub-repo').value = 'digitaldedication/nbc3dmodel';
    $('pub-repo').dispatchEvent(new Event('change', { bubbles: true }));
    $('pub-branch').value = 'claude/nice-bohr-ynfyso';
    $('pub-branch').dispatchEvent(new Event('change', { bubbles: true }));
  });
  const veldenZichtbaar = await page.evaluate(() => getComputedStyle(document.getElementById('pub-velden')).display);
  console.log('publiceer-velden zichtbaar:', veldenZichtbaar);

  // event met echte logo-upload
  await page.setInputFiles('#logo', 'scene-inspection/testpilaarlogo.png');
  await page.evaluate(() => { document.getElementById('eventName').value = 'Publiceertest'; });
  await page.click('#save');
  await new Promise((r) => setTimeout(r, 3000));

  const info = await page.evaluate(() => {
    const ev = (JSON.parse(localStorage.getItem('nbc3d-events-v1') || '[]'))[0];
    const openHref = document.querySelector('#events a.btn')?.href || null;
    const knoppen = [...document.querySelectorAll('#events button')].map((b) => b.textContent);
    return { token: ev && ev.token, published: ev && ev.published, openHref, knoppen, toast: document.getElementById('toast').textContent };
  });
  console.log('event gepubliceerd:', info.published, '| token:', info.token);
  console.log('open-link lengte:', info.openHref && info.openHref.length, '→', info.openHref);
  console.log('knoppen:', info.knoppen.join(' / '));
  console.log('melding:', info.toast);
  // de sleutel mag nooit in de config of de link zitten
  const lek = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('nbc3d-events-v1'))).includes('github_pat_'));
  console.log('sleutel lekt in opgeslagen event:', lek);

  // korte link openen in de viewer
  await page.goto(info.openHref);
  const ok = await page.waitForSelector('#status.hidden', { timeout: 240000 }).then(() => true).catch(() => false);
  const err = await page.evaluate(() => { const e = document.querySelector('#status .err'); return e && e.textContent.trim(); });
  console.log('korte link rendert:', ok, '| fout:', err || '(geen)');
  await page.screenshot({ path: 'scene-inspection/viewer-kortelink.png' });

  // onbekend token → nette melding
  await page.goto('http://127.0.0.1:8787/nbc3dmodel/viewer/?e=bestaatniet123');
  await new Promise((r) => setTimeout(r, 2500));
  const err2 = await page.evaluate(() => { const e = document.querySelector('#status .err'); return e && e.textContent.trim().slice(0, 120); });
  console.log('onbekend token toont:', JSON.stringify(err2));
} finally {
  if (writtenToken) { try { rmSync(`configs/${writtenToken}.json`); } catch (e) {} }
  await browser.close();
  server.kill();
}
