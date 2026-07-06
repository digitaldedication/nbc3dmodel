import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const key = process.argv[2] || 'congres';
const targets = (process.argv[3] || 'Pilaar 2,Scherm midden,LED L + R,Links + Rechts,Podium Grand Hall').split(',');

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

  const report = await page.evaluate((targets) => {
    const app = window.__app;
    const out = [];
    const describeMaterial = (m) => {
      const colors = [];
      const textures = [];
      const layers = [];
      const seen = new Set();
      const walk = (obj, path, depth) => {
        if (!obj || typeof obj !== 'object' || depth > 7 || seen.has(obj)) return;
        seen.add(obj);
        if (obj.isColor) { colors.push({ path, hex: '#' + obj.getHexString() }); return; }
        if (obj.isTexture) { const img = obj.image; textures.push({ path, w: img && img.width, h: img && img.height }); return; }
        if (obj.type && typeof obj.type === 'string' && /gradient|color|image|layer/i.test(obj.type)) layers.push({ path, type: obj.type });
        if (obj instanceof Map) { let i = 0; for (const v of obj.values()) walk(v, `${path}.m[${i++}]`, depth + 1); return; }
        if (Array.isArray(obj)) { obj.forEach((v, i) => walk(v, `${path}[${i}]`, depth + 1)); return; }
        for (const k of Object.keys(obj)) {
          if (k.startsWith('__') || ['parent', 'children', 'shared', 'thisContext'].includes(k)) continue;
          const v = obj[k];
          if (v && typeof v === 'object') walk(v, `${path}.${k}`, depth + 1);
        }
      };
      walk(m, 'mat', 0);
      return { name: m.name, type: m.type, colors: colors.slice(0, 30), textures: textures.slice(0, 10), layers: layers.slice(0, 20) };
    };
    for (const t of targets) {
      const objs = [];
      app._scene.traverse((o) => { if ((o.name || '').trim() === t.trim()) objs.push(o); });
      for (const o of objs.slice(0, 2)) {
        const meshes = [];
        o.traverse((c) => { if (c.isMesh && c.material) meshes.push(c); });
        if (o.isMesh && o.material) meshes.unshift(o);
        out.push({
          target: t, found: o.name, meshCount: meshes.length,
          meshes: meshes.slice(0, 8).map((c) => ({ mesh: c.name, material: describeMaterial(Array.isArray(c.material) ? c.material[0] : c.material) })),
        });
      }
      if (!objs.length) out.push({ target: t, found: null });
    }
    return out;
  }, targets);
  console.log(JSON.stringify(report, null, 1));
} finally {
  await browser.close();
  server.kill();
}
