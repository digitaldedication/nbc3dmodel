import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const key = process.argv[2] || 'congres';
const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
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
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent(`/assets/spline/${key}/scene.splinecode`)}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });

  const report = await page.evaluate(() => {
    const app = window.__app;
    const cache = app._sharedAssetsManager.imageHolderCache.cache;
    const holders = cache instanceof Map ? [...cache.values()] : Object.values(cache);
    const byImg = new Map();
    for (const h of holders) {
      const name = h?.name || h?.data?.name || '';
      if (h?.img && /Event Hall|pilaar|narrowcasting|Led wall/i.test(name)) byImg.set(h.img, name);
    }
    const hits = [];
    const seen = new Set();
    const walk = (obj, path, depth, matName) => {
      if (!obj || typeof obj !== 'object' || depth > 8 || seen.has(obj)) return;
      seen.add(obj);
      if (obj.isTexture) {
        const img = obj.image || (obj.source && obj.source.data);
        if (img && byImg.has(img)) hits.push({ matName, path, asset: byImg.get(img), texType: obj.constructor.name });
        return;
      }
      if (obj instanceof Map) { let i = 0; for (const v of obj.values()) walk(v, `${path}.map[${i++}]`, depth + 1, matName); return; }
      if (Array.isArray(obj)) { obj.forEach((v, i) => walk(v, `${path}[${i}]`, depth + 1, matName)); return; }
      for (const k of Object.keys(obj)) {
        if (k.startsWith('__') || k === 'parent' || k === 'children') continue;
        const v = obj[k];
        if (v && typeof v === 'object') walk(v, `${path}.${k}`, depth + 1, matName);
      }
    };
    const mats = new Set();
    app._scene.traverse((o) => {
      if (o.isMesh && o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
    });
    for (const m of mats) walk(m, 'mat', 0, (m.name || m.type) + '#' + m.uuid.slice(0, 6));

    // ook: holder.cache structuur van 1 scherm-holder
    const h = holders.find((x) => /Event Hall Scherm - Deel 1/i.test(x?.name || x?.data?.name || ''));
    const describe = (v, d = 0) => {
      if (!v || typeof v !== 'object' || d > 3) return typeof v;
      if (v.isTexture) return 'TEXTURE(' + v.constructor.name + ')';
      if (v instanceof Map) return 'Map{' + [...v.entries()].slice(0, 6).map(([k, x]) => `${String(k).slice(0, 30)}:${describe(x, d + 1)}`).join(', ') + '}';
      if (Array.isArray(v)) return '[' + v.slice(0, 6).map((x) => describe(x, d + 1)).join(', ') + ']';
      return '{' + Object.keys(v).slice(0, 12).map((k) => `${k}:${describe(v[k], d + 1)}`).join(', ') + '}';
    };
    return { hits: hits.slice(0, 60), holderCache: h ? describe(h.cache) : null, holder_cache2: h ? describe(h._cache) : null };
  });
  console.log(JSON.stringify(report, null, 1));
} finally {
  await browser.close();
  server.kill();
}
