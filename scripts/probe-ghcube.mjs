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
    const { listImageAssets, swapHolderImage, findGrandHallPlane } = await import('/src/branding.js');
    const assets = listImageAssets(app).filter((a) => a.name && /logo pilaar/i.test(a.name));
    const ghInfo = findGrandHallPlane(app, assets);
    if (!ghInfo || !ghInfo.plane) return 'geen gh-plane';
    const ghAsset = assets.find((a) => a.holder === ghInfo.holder);
    // kwadranten in de gh-holder: LB=cyaan RB=geel LO=magenta RO=wit, rood boven
    const c = document.createElement('canvas');
    c.width = (ghAsset && ghAsset.width) || 426; c.height = (ghAsset && ghAsset.height) || 191;
    const g = c.getContext('2d'); const w = c.width, h = c.height;
    g.fillStyle = '#00ffff'; g.fillRect(0, 0, w / 2, h / 2);
    g.fillStyle = '#ffff00'; g.fillRect(w / 2, 0, w / 2, h / 2);
    g.fillStyle = '#ff00ff'; g.fillRect(0, h / 2, w / 2, h / 2);
    g.fillStyle = '#ffffff'; g.fillRect(w / 2, h / 2, w / 2, h / 2);
    g.fillStyle = '#ff0000'; g.fillRect(0, 0, w, Math.round(h * 0.08));
    swapHolderImage(ghInfo.holder, c);

    // cube van het middenscherm zoeken (zoals setupGrandHallScreen)
    let schermMidden = null, welkom = null, cube = null;
    scene.traverse((o) => { if (!schermMidden && (o.name || '').trim() === 'Scherm midden') schermMidden = o; });
    if (!schermMidden) return 'geen Scherm midden';
    schermMidden.traverse((o) => {
      if (!welkom && o.isMesh && (o.name || '').trim() === 'Welkom') welkom = o;
      if (!cube && o.isMesh && /^Cube/.test((o.name || '').trim())) cube = o;
    });
    if (!cube) return 'geen cube';
    const wparent = welkom && welkom.parent && /welkom/i.test(welkom.parent.name || '') ? welkom.parent : welkom;
    if (wparent) wparent.visible = false;
    const pm = Array.isArray(ghInfo.plane.material) ? ghInfo.plane.material[0] : ghInfo.plane.material;
    cube.material = pm;
    cube.material.needsUpdate = true;
    ghInfo.plane.visible = false;
    if (app.requestRender) app.requestRender();
    return { ok: true, holderW: c.width, holderH: c.height };
  });
  console.log(JSON.stringify(rep));
  await new Promise((r) => setTimeout(r, 4000));
  await page.screenshot({ path: 'scene-inspection/probe-ghcube.png' });
  console.log('OK: scene-inspection/probe-ghcube.png');
} finally {
  await browser.close();
  server.kill();
}
