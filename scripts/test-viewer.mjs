import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';

mkdirSync('scene-inspection', { recursive: true });
const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

// Demo-config zoals de beheerpagina die genereert
const config = {
  eventName: 'ACME Kickoff 2026',
  colors: { primary: '#E4032E', secondary: '#1B2A7B' },
  scene: 'congres',
  eventhall: { type: 'preset:geel', logoSpots: 2 },
  grandhall: { mode: 'zwart' },
  logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAAFoCAYAAACv5J9AAAAJZ0lEQVR4nO3da47TShCA0c7d/55zfwxoQJOEPOzqepyzAIjkslRfuxFrAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADkctn9Azjf9Xq9HvVnXS4XMwMAwNsskw0cGRifEigAADxiWSwmU2w8S5QAAPCbxTC5isHxL4IEAGAui2BCHaPjHjECADCL5S+JSdFxjxgBAOjPwreR6LhPjAAA9GTJ20B4PE+IAAD0YrkLIjo+J0YAAOqz0J1MeBxPiAAA1GWRO4nwOJ8QAQCoxwJ3MOERT4gAANRhcTuI8NhPiAAA5Gdh+5DwyEeIAADk9d/uH1CZ+MjJcwEAyMtJ8RssuHX4GgIAkIvl7AXCoy4hAgCQgytYTxIftXl+AAA5CJAnWF578BwBAPZzLeUBC2tfrmQBAOzhC8gd4qM3zxcAYA8BcoPldAbPGQAgnmsof7CQzuVKFgBADF9AfhEfs3n+AAAxBMiyfPLFHAAAnG98gFg6+ZN5AAA41+gAsWxyi7kAADjP2ACxZPKI+QAAOMfIALFc8gxzAgBwvHEBYqnkFeYFAOBYowLEMsk7zA0AwHHGBIglkk+YHwCAY4wIEMsjRzBHAACfax8glkaOZJ4AAD7TOkAsi5zBXAEAvK9tgFgSOZP5AgB4T8sAsRwSwZwBALyuXYBYColk3gAAXtMuQAAAgLxaBYjTaHYwdwAAz2sTIJZAdjJ/AADPaREglj8yMIcAAP/WIkAAAIAaygeIU2cyMY8AAI+VDhDLHhmZSwCA+8oGiCWPzMwnAMBtZQMEAACop2SAOF2mAnMKAPBTyQABAABqKhcgTpWpxLwCAPytVIBY5qjI3AIAfCsVIAAAQG1lAsQpMpWZXwCAL2UCBAAAqK9EgDg9pgNzDABQJEAAAIAe0geIU2M6Mc8AwHTpAwQAAOgjdYA4LaYjcw0ATJY6QAAAgF4uu3/APU6J6e5yuaR9/47iPQaAPTLvGb6AAAAAYQQIAAAQJmWAuLbBBOYcAJgoZYAAAAA9pQsQp8JMYt4BgGnSBQgAANCXAAEAAMKkChDXUZjI3AMAk6QKEAAAoDcBAgAAhEkTIK6hMJn5BwCmSBMgAABAfwIEAAAIkyJAXD8B7wEAMEOKAAEAAGYQIAAAQBgBAgAAhNkeIO69wzfvAwDQ3fYAAQAA5hAgAABAGAECAACEESAAAECYrQHiH9zCT94LAKAzX0AAAIAwAgQAAAgjQAAAgDACBAAACCNAAACAMAIEAAAII0AAAIAw2wLE/3UA93k/AICufAEBAADCCBAAACCMAAEAAMIIEAAAIIwAAQAAwggQAAAgjAABAADCCBAAACCMAAEAAMIIEAAAIIwAAQAAwggQAAAgjAABAADCCBAAACCMAAEAAMIIEAAAIIwAAQAAwggQAAAgzLYAuVwul11/N2Tn/QAAuvIFBAAACCNAAACAMAIEAAAII0AAAIAwAgQAAAgjQAAAgDACBAAACLM1QPxfB/CT9wIA6MwXEAAAIIwAAQAAwggQAAAgjAABAADCbA8Q/+AWvnkfAIDutgcIAAAwhwABAADCCBAAACBMigBx7x28BwDADCkCBAAAmEGAAAAAYdIEiOsnTGb+AYAp0gQIAADQnwABAADCpAoQ11CYyNwDAJOkChAAAKA3AQIAAIRJFyCuozCJeQcApkkXIAAAQF8pA8SpMBOYcwBgopQBAgAA9CRAAACAMKmvgFyv1+vu3wBncP0KAJjKFxAAACBM6gBxSkxH5hoAmCx1gAAAAL2kDxCnxXRingGA6dIHCAAA0EeJAHFqTAfmGACgSIAAAAA9lAkQp8dUZn4BAL6UCRAAAKC+UgHiFJmKzC0AwLdSAbKWZY5azCsAwN/KBQgAAFBXyQBxqkwF5hQA4KeSAQIAANRUNkCcLpOZ+QQAuK1sgKxlySMncwkAcF/pAFnLskcu5hEA4LHyAQIAANTRIkCcOpOBOQQA+LcWAbKW5Y+9zB8AwHPaBMhalkD2MHcAAM9rFSAAAEBu7QLEaTSRzBsAwGvaBchalkJimDMAgNe1DJC1LIecy3wBALynbYCsZUnkHOYKAOB9rQNkLcsixzJPAACfaR8ga1kaOYY5AgD43IgAWcvyyGfMDwDAMcYEyFqWSN5jbgAAjjMqQNayTPIa8wIAcKxxAbKWpZLnmBMAgOONDJC1LJc8Zj4AAM4xNkDWsmRym7kAADjP6ABZy7LJ38wDAMC5xgfIWpZOvpgDAIDzCZBfLJ+zef4AADEsXTdcr9fr7t9ADOEBABDLF5AbLKUzeM4AAPEEyB2W0948XwCAPSxhT3Alqw/hAQCwly8gT7C09uA5AgDsJ0CeZHmtzfMDAMjBUvYGV7LqEB4AALlYzj4gRPISHgAAObmC9QFLbk6eCwBAXha1g/gasp/wAADIz8J2MCEST3gAANRhcTuJEDmf8AAAqMcCdzIhcjzhAQBQl0UuiBD5nPAAAKjPQreBGHme6AAA6MVyt5EQuU94AAD0ZMlLQoyIDgCACSx8CU2KEdEBADCL5S+5jjEiOgAA5rIIFlMxSAQHAAC/WQwbyBQlYgMAgEcsiwMcGSgCAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAA/wOGEuF9+3uJcAAAAABJRU5ErkJggg==',
  screens: { pilaren: 'data:image/png;base64,' + readFileSync('scene-inspection/testpilaar-text.png').toString('base64') },
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
  await new Promise((r) => setTimeout(r, 14000));
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
