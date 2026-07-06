import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/test-branding.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await page.evaluate('window.__applyBranding()');
  await page.waitForFunction('window.__branded === true', null, { timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));

  // maak de plane-content dekkend groen (426x191, exacte holdermaat)
  await page.evaluate(() => {
    const app = window.__app;
    // vind de holder van het GH-vlak via de branding-module niet; pak alle pilaren-holders en kleur ze ALLEMAAL groen
    const cache = app._sharedAssetsManager.imageHolderCache.cache;
    const holders = (cache instanceof Map ? [...cache.values()] : Object.values(cache))
      .filter((h) => /logo pilaar/i.test(h.name || (h.data && h.data.name) || ''));
    for (const h of holders) {
      const c = document.createElement('canvas');
      c.width = (h.img && h.img.width) || 426; c.height = (h.img && h.img.height) || 191;
      const x = c.getContext('2d'); x.fillStyle = '#00ff00'; x.fillRect(0, 0, c.width, c.height);
      // zelfde swap-logica als branding.js
      const texs = []; const seen = new Set();
      const scan = (v, d) => { if (!v || typeof v !== 'object' || d > 6 || seen.has(v)) return; seen.add(v);
        if (v.isTexture) { texs.push(v); return; }
        if (v instanceof Map) { for (const x2 of v.values()) scan(x2, d + 1); return; }
        if (Array.isArray(v)) { for (const x2 of v) scan(x2, d + 1); return; }
        for (const k of Object.keys(v)) { if (k === 'shared' || k === 'thisContext') continue; scan(v[k], d + 1); } };
      scan(h._cache, 0);
      h.img = c;
      for (const t of texs) { if (t.source && 'data' in t.source) t.source.data = c; t.image = c; t.needsUpdate = true; if (t.source) t.source.needsUpdate = true; }
    }
    if (app.requestRender) app.requestRender();
  });
  await new Promise((r) => setTimeout(r, 2000));

  // huidige (uniforme su) toestand
  const dump = await page.evaluate(() => {
    let plane = null;
    window.__app._scene.traverse((o) => { if (!plane && o.name === 'brand-logo-grandhall') plane = o; });
    window.__plane = plane;
    return { scale: plane.scale.toArray().map((v) => +v.toFixed(3)), auto: plane.matrixAutoUpdate };
  });
  console.log('na branding:', JSON.stringify(dump));
  await page.screenshot({ path: 'scene-inspection/sc-uniform.png', clip: { x: 330, y: 180, width: 290, height: 160 }, timeout: 120000 });

  // niet-uniform: hoogte-as ×4.36 (22 → 96) bovenop de uniforme schaal
  const d2 = await page.evaluate(() => {
    const p = window.__plane;
    // welke lokale as is (na rotatie) verticaal? probeer y eerst
    p.scale.y *= 4.36;
    p.updateMatrix(); p.updateWorldMatrix(true, false);
    if (window.__app.requestRender) window.__app.requestRender();
    return { scale: p.scale.toArray().map((v) => +v.toFixed(3)), auto: p.matrixAutoUpdate };
  });
  console.log('non-uniform y:', JSON.stringify(d2));
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: 'scene-inspection/sc-nonuni-y.png', clip: { x: 330, y: 180, width: 290, height: 160 }, timeout: 120000 });

  // en de x-as terugverkleinen als test: x/2
  const d3 = await page.evaluate(() => {
    const p = window.__plane;
    p.scale.x *= 0.5;
    p.updateMatrix(); p.updateWorldMatrix(true, false);
    if (window.__app.requestRender) window.__app.requestRender();
    return { scale: p.scale.toArray().map((v) => +v.toFixed(3)) };
  });
  console.log('non-uniform x:', JSON.stringify(d3));
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: 'scene-inspection/sc-nonuni-x.png', clip: { x: 330, y: 180, width: 290, height: 160 }, timeout: 120000 });
} finally {
  await browser.close();
  server.kill();
}
