import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const key = process.argv[2] || 'congres';
const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
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
await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent(`/assets/spline/${key}/scene.splinecode`)}`);
await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });

const report = await page.evaluate(() => {
  const app = window.__app;
  const out = { appKeys: Object.keys(app), managers: {} };
  for (const k of Object.keys(app)) {
    const v = app[k];
    if (v && typeof v === 'object' && /asset|image|texture|load/i.test(k)) {
      out.managers[k] = Object.keys(v).slice(0, 40);
    }
  }
  // zoek dieper: elk object met 'images' of 'assets' property
  const findings = [];
  for (const k of Object.keys(app)) {
    const v = app[k];
    if (!v || typeof v !== 'object') continue;
    for (const kk of Object.keys(v)) {
      if (/image|asset|texture/i.test(kk)) {
        const vv = v[kk];
        let info = typeof vv;
        if (vv instanceof Map) info = `Map(${vv.size}) keys=${[...vv.keys()].slice(0, 25).join(', ')}`;
        else if (Array.isArray(vv)) info = `Array(${vv.length})`;
        else if (vv && typeof vv === 'object') info = `obj keys=${Object.keys(vv).slice(0, 25).join(', ')}`;
        findings.push(`${k}.${kk}: ${info}`);
      }
    }
  }
  out.findings = findings;
  return out;
});
console.log(JSON.stringify(report, null, 2));
await browser.close();
server.kill();
