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
  const am = app._sharedAssetsManager;
  const out = {};

  const describeCacheLike = (c) => {
    if (!c) return null;
    if (c instanceof Map) {
      return [...c.entries()].map(([k, v]) => ({
        key: String(k),
        keys: v && typeof v === 'object' ? Object.keys(v).slice(0, 15) : typeof v,
        name: v && (v.name || (v.data && v.data.name)) || null,
        w: v && v.img && (v.img.width || v.img.videoWidth) || null,
        h: v && v.img && (v.img.height || v.img.videoHeight) || null,
      }));
    }
    if (typeof c === 'object') {
      return Object.entries(c).map(([k, v]) => ({
        key: k,
        keys: v && typeof v === 'object' ? Object.keys(v).slice(0, 15) : typeof v,
        name: v && (v.name || (v.data && v.data.name)) || null,
        w: v && v.img && (v.img.width || v.img.videoWidth) || null,
        h: v && v.img && (v.img.height || v.img.videoHeight) || null,
      }));
    }
    return String(typeof c);
  };

  out.imageHolderCache_cache = describeCacheLike(am.imageHolderCache && am.imageHolderCache.cache);
  out.imageHolderCache_shared = describeCacheLike(am.imageHolderCache && am.imageHolderCache.shared);

  // scene data: zoek de assets-lijst met namen
  const data = am.data || app._data;
  if (data && typeof data === 'object') {
    out.dataKeys = Object.keys(data).slice(0, 30);
    for (const k of ['images', 'assets', 'shared']) {
      const v = data[k];
      if (v && typeof v === 'object') {
        out['data_' + k] = Array.isArray(v)
          ? v.slice(0, 40).map((x) => x && (x.name || x.id) || typeof x)
          : Object.keys(v).slice(0, 40);
      }
    }
  }
  return out;
});
console.log(JSON.stringify(report, null, 2));
await browser.close();
server.kill();
