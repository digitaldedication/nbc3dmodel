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
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 8000));

  const rep = await page.evaluate(async () => {
    const app = window.__app;
    const scene = app._scene;
    const { listImageAssets } = await import('/src/branding.js');
    const assets = listImageAssets(app);
    const eh = assets.find((a) => /event\s*hall\s*scherm/i.test(a.name || ''));
    if (!eh) return 'geen eventhall-asset';
    // holder-textures verzamelen
    const texs = [];
    const seen = new Set();
    const scan = (v, d) => {
      if (!v || typeof v !== 'object' || d > 6 || seen.has(v)) return;
      seen.add(v);
      if (v.isTexture) { texs.push(v); return; }
      if (v instanceof Map) { for (const x of v.values()) scan(x, d + 1); return; }
      if (Array.isArray(v)) { for (const x of v) scan(x, d + 1); return; }
      for (const k of Object.keys(v)) { if (k === 'shared' || k === 'thisContext') continue; scan(v[k], d + 1); }
    };
    scan(eh.holder._cache, 0);
    // mesh vinden dat deze texture gebruikt
    let src = null;
    scene.traverse((o) => {
      if (src || !o.isMesh || !o.material) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      const su = new Set(); let found = false;
      const walk = (x, d) => {
        if (found || !x || typeof x !== 'object' || d > 8 || su.has(x)) return;
        su.add(x);
        if (texs.includes(x)) { found = true; return; }
        if (x instanceof Map) { for (const v of x.values()) walk(v, d + 1); return; }
        if (Array.isArray(x)) { for (const v of x) walk(v, d + 1); return; }
        for (const k of Object.keys(x)) {
          if (k.startsWith('__') || ['parent', 'children', 'shared', 'thisContext'].includes(k)) continue;
          const v = x[k]; if (v && typeof v === 'object') walk(v, d + 1);
        }
      };
      walk(m, 0);
      if (found) src = { mesh: o, mat: m };
    });
    if (!src) return 'geen mesh met eventhall-texture';

    let sm = null, welkom = null, cube = null;
    scene.traverse((o) => { if (!sm && (o.name || '').trim() === 'Scherm midden') sm = o; });
    sm.traverse((o) => {
      if (!welkom && o.isMesh && (o.name || '').trim() === 'Welkom') welkom = o;
      if (!cube && o.isMesh && /^Cube/.test((o.name || '').trim())) cube = o;
    });
    const wparent = welkom && welkom.parent && /welkom/i.test(welkom.parent.name || '') ? welkom.parent : welkom;
    if (wparent) wparent.visible = false;

    // hue-canvas in de EH-holder (diagnose van de cube-mapping)
    const { swapHolderImage } = await import('/src/branding.js');
    const hc = document.createElement('canvas');
    hc.width = eh.width || 1359; hc.height = eh.height || 850;
    {
      const g = hc.getContext('2d');
      for (let x = 0; x < hc.width; x += 4) {
        const hue = (x / hc.width) * 300;
        const grad = g.createLinearGradient(0, 0, 0, hc.height);
        grad.addColorStop(0, 'hsl(' + hue + ',100%,80%)');
        grad.addColorStop(1, 'hsl(' + hue + ',100%,25%)');
        g.fillStyle = grad; g.fillRect(x, 0, 4, hc.height);
      }
    }
    swapHolderImage(eh.holder, hc);
    let cloned = null, cloneErr = 'overgeslagen';
    let texReplaced = 0, newTexErr = null;
    if (cloned) {
      try {
        const c = document.createElement('canvas');
        c.width = 1280; c.height = 720;
        const g = c.getContext('2d');
        for (let x = 0; x < c.width; x += 4) {
          const hue = (x / c.width) * 300;
          const grad = g.createLinearGradient(0, 0, 0, c.height);
          grad.addColorStop(0, `hsl(${hue},100%,75%)`);
          grad.addColorStop(1, `hsl(${hue},100%,25%)`);
          g.fillStyle = grad; g.fillRect(x, 0, 4, c.height);
        }
        // nieuwe texture van dezelfde klasse als de bestaande
        const ref = texs[0];
        const NT = ref.constructor;
        const nt = new NT(c);
        nt.flipY = ref.flipY; nt.colorSpace = ref.colorSpace; nt.wrapS = ref.wrapS; nt.wrapT = ref.wrapT;
        nt.minFilter = ref.minFilter; nt.magFilter = ref.magFilter;
        nt.needsUpdate = true;
        // vervang texture-referenties in de kloon-uniforms
        const su2 = new Set();
        const rep = (x, d) => {
          if (!x || typeof x !== 'object' || d > 8 || su2.has(x)) return;
          su2.add(x);
          if (x instanceof Map) { for (const v of x.values()) rep(v, d + 1); return; }
          if (Array.isArray(x)) { for (let i = 0; i < x.length; i++) { if (texs.includes(x[i])) { x[i] = nt; texReplaced++; } else rep(x[i], d + 1); } return; }
          for (const k of Object.keys(x)) {
            if (k.startsWith('__') || ['parent', 'children', 'shared', 'thisContext'].includes(k)) continue;
            const v = x[k];
            if (texs.includes(v)) { x[k] = nt; texReplaced++; }
            else if (v && typeof v === 'object') rep(v, d + 1);
          }
        };
        rep(cloned, 0);
        cloned.needsUpdate = true;
      } catch (e) { newTexErr = e.message; }
      cube.material = cloned;
      cube.material.needsUpdate = true;
    } else {
      // fallback: direct het bronmateriaal (deelt holder met event hall)
      cube.material = src.mat;
      cube.material.needsUpdate = true;
    }
    if (app.requestRender) app.requestRender();
    return { bron: src.mesh.name, cloneErr, texReplaced, newTexErr };
  });
  console.log(JSON.stringify(rep));
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: 'scene-inspection/probe-ghclone.png' });
  console.log('OK: scene-inspection/probe-ghclone.png');
} finally {
  await browser.close();
  server.kill();
}
