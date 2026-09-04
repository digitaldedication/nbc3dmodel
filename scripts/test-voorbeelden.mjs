// Controleert dat de gepubliceerde voorbeelden (configs/voorbeelden.json) in
// de beheeromgeving verschijnen — los van localStorage, dus ook in een verse
// browser of na een verhuizing van het adres — en dat "Bewerken" de
// gepubliceerde config in het formulier laadt. Tot slot: de korte link
// (?e=TOKEN) toont in de viewer de eventnaam in de badge.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('configs/voorbeelden.json', 'utf8')).events;
const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
let failed = false;
const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FOUT ') + msg); if (!ok) failed = true; };
const blokkeerExtern = (page) => page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());

try {
  /* --- beheeromgeving: voorbeelden zichtbaar zonder opgeslagen events --- */
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await blokkeerExtern(page);
  page.on('pageerror', (e) => console.log('pageerror:', e.message));
  await page.goto('http://127.0.0.1:8787/nbc3dmodel/admin/');
  await page.waitForSelector('#voorbeelden .event', { timeout: 15000 });

  const items = await page.$$eval('#voorbeelden .event', (els) => els.map((el) => ({
    name: el.querySelector('b').textContent,
    href: el.querySelector('a.btn').href,
    knoppen: [...el.querySelectorAll('button')].map((b) => b.textContent),
  })));
  check(items.length === manifest.length, `${items.length} voorbeelden getoond (verwacht ${manifest.length})`);
  for (const m of manifest) {
    const hit = items.find((i) => i.href.endsWith('/viewer/?e=' + m.token));
    check(!!hit && hit.name === m.name, `${m.name}: ${hit ? hit.href : 'ontbreekt'}`);
    check(!!hit && hit.knoppen.includes('Bewerken') && hit.knoppen.includes('Kopieer korte link'), `${m.name}: knoppen ${JSON.stringify(hit && hit.knoppen)}`);
  }
  const opgeslagenLeeg = await page.evaluate(() => (JSON.parse(localStorage.getItem('nbc3d-events-v1') || '[]')).length === 0);
  check(opgeslagenLeeg, 'voorbeelden staan los van "Opgeslagen events" (localStorage nog leeg)');

  /* --- Bewerken: gepubliceerde config in het formulier + als event bewaard --- */
  const first = manifest[0];
  const cfg = JSON.parse(readFileSync(`configs/${first.token}.json`, 'utf8'));
  await page.click(`#voorbeelden .event:has-text("${first.name}") button:has-text("Bewerken")`);
  await page.waitForFunction((name) => document.getElementById('eventName').value === name, cfg.eventName, { timeout: 10000 });
  const form = await page.evaluate(() => ({
    name: document.getElementById('eventName').value,
    c1: document.getElementById('c1').value,
    c2: document.getElementById('c2').value,
    scene: document.querySelector('input[name=scene]:checked').value,
    grandhall: document.getElementById('hall-grandhall').checked,
    decor: document.getElementById('eh-decor').value,
    saved: JSON.parse(localStorage.getItem('nbc3d-events-v1') || '[]').map((e) => ({ token: e.token, name: e.name, published: e.published })),
    lijst: [...document.querySelectorAll('#events .event')].map((el) => el.querySelector('b').textContent + ' · ' + el.querySelector('.tok').textContent),
  }));
  check(form.name === cfg.eventName, `naam in formulier: ${form.name}`);
  check(form.c1.toLowerCase() === cfg.colors.primary.toLowerCase(), `kleur 1: ${form.c1}`);
  check(form.c2.toLowerCase() === cfg.colors.secondary.toLowerCase(), `kleur 2: ${form.c2}`);
  check(form.scene === cfg.scene, `opstelling: ${form.scene}`);
  check(form.grandhall === (cfg.halls.grandhall !== false), `Grand Hall aan: ${form.grandhall}`);
  check(form.decor === cfg.eventhall.type, `decor: ${form.decor}`);
  const saved = form.saved.find((e) => e.token === first.token);
  check(!!saved && saved.published === true && saved.name === cfg.eventName, `als gepubliceerd event bewaard: ${JSON.stringify(saved)}`);
  check(form.lijst.some((t) => t.startsWith(cfg.eventName) && /korte link actief/.test(t)), `zichtbaar bij "Opgeslagen events": ${form.lijst[0]}`);

  // nog een keer Bewerken → geen dubbele entry
  await page.click(`#voorbeelden .event:has-text("${first.name}") button:has-text("Bewerken")`);
  await new Promise((r) => setTimeout(r, 800));
  const aantal = await page.evaluate((t) => JSON.parse(localStorage.getItem('nbc3d-events-v1') || '[]').filter((e) => e.token === t).length, first.token);
  check(aantal === 1, `na 2x Bewerken één entry voor ${first.token} (gevonden: ${aantal})`);

  /* --- viewer: korte link laadt de config (badge met eventnaam) --- */
  for (const m of manifest) {
    const c = JSON.parse(readFileSync(`configs/${m.token}.json`, 'utf8'));
    const v = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    await blokkeerExtern(v);
    await v.goto(`http://127.0.0.1:8787/nbc3dmodel/viewer/?e=${m.token}`);
    await v.waitForFunction(() => document.getElementById('badge').style.display !== 'none', null, { timeout: 30000 })
      .catch(() => {});
    const badge = await v.evaluate(() => ({ text: document.getElementById('badge').textContent, logo: !!document.querySelector('#badge img'), status: document.getElementById('status').textContent }));
    check(badge.text.includes(c.eventName) && badge.logo === !!c.logo, `viewer ?e=${m.token}: badge "${badge.text}" (logo: ${badge.logo})`);
    await v.close();
  }
} finally {
  await browser.close();
  server.kill();
}
if (failed) { console.log('\nEr zijn controles mislukt.'); process.exit(1); }
console.log('\nAlle controles geslaagd.');
