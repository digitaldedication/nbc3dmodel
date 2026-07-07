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
    let sm = null, welkom = null, cube = null, ehall = null, curtain = null;
    scene.traverse((o) => {
      if (!sm && (o.name || '').trim() === 'Scherm midden') sm = o;
      if (!ehall && o.isMesh && /event hall scherm/i.test(o.name || '')) ehall = o;
      if (!curtain && o.isMesh && /gordijn|curtain/i.test(o.name || '')) curtain = o;
    });
    sm.traverse((o) => {
      if (!welkom && o.isMesh && (o.name || '').trim() === 'Welkom') welkom = o;
      if (!cube && o.isMesh && /^Cube/.test((o.name || '').trim())) cube = o;
    });
    if (!cube) return 'geen cube';
    const wparent = welkom && welkom.parent && /welkom/i.test(welkom.parent.name || '') ? welkom.parent : welkom;
    if (wparent) wparent.visible = false;
    const src = ehall || curtain;
    if (!src) return 'geen bronmateriaal';
    cube.material = Array.isArray(src.material) ? src.material[0] : src.material;
    cube.material.needsUpdate = true;
    if (app.requestRender) app.requestRender();
    return { ok: true, bron: src.name };
  });
  console.log(JSON.stringify(rep));
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: 'scene-inspection/probe-ghmat.png' });
  console.log('OK: scene-inspection/probe-ghmat.png');
} finally {
  await browser.close();
  server.kill();
}
