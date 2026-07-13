// Test: volledige theateropstelling Grand Hall (applyBranding + fullTheater),
// met screenshots vanuit de zaal.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 600)); });
  page.on('pageerror', (e) => console.log('[pageerror]', (e.stack || e.message).slice(0, 600)));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 4000));

  const res = await page.evaluate(async () => {
    const { applyBranding } = await import('/src/branding.js?test');
    const r = await applyBranding(window.__app, {
      colors: { primary: '#E4032E', secondary: '#1B2A7B' },
      grandhall: { mode: 'kleur', fullTheater: true },
    });
    return { ghTheaterRows: r.ghTheaterRows, eventhallParts: r.eventhallParts };
  });
  console.log(JSON.stringify(res));

  // camera 1: hoog achter in de zaal, richting podium (zoals de schets)
  const setCam = (px, py, pz, tx, ty, tz) => page.evaluate(([px, py, pz, tx, ty, tz]) => {
    const app = window.__app;
    app._camera.position.set(px, py, pz);
    app._camera.lookAt(tx, ty, tz);
    app._camera.updateMatrixWorld(true);
    if (app._controls && app._controls.target && app._controls.target.set) {
      app._controls.target.set(tx, ty, tz);
      if (app._controls.update) app._controls.update();
    }
    if (app.requestRender) app.requestRender();
  }, [px, py, pz, tx, ty, tz]);

  await setCam(726, 190, 180, 726, -35, 750);
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: 'scene-inspection/ghtheater-achterin.png', timeout: 120000 });

  await setCam(726, 260, 950, 726, -40, 450);
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: 'scene-inspection/ghtheater-vanafpodium.png', timeout: 120000 });

  // top-down overzicht van de hele hal
  await setCam(726, 620, 567, 726, -40, 566);
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: 'scene-inspection/ghtheater-topdown.png', timeout: 120000 });

  // rijen per kolom tellen (incl. nieuwe)
  const telling = await page.evaluate(() => {
    const scene = window.__app._scene;
    let grid = null;
    scene.traverse((o) => { if (!grid && (o.name || '') === 'Stoelen Grid podium') grid = o; });
    const perKolom = {};
    grid.traverse((o) => {
      const naam = o.data && (o.data.name || o.name) || '';
      if (o.data && o.data.type === 'Instance' && (/rij stoelen/i.test(naam) || /theaterrij/i.test(naam))) {
        // bbox-centrum van de stoelen zelf
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, n = 0;
        o.updateWorldMatrix(true, true);
        o.traverse((m) => {
          if (!m.isMesh || !m.geometry) return;
          n++;
          if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
          const bb = m.geometry.boundingBox, e = m.matrixWorld.elements;
          for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
            const wx = e[0]*x+e[4]*y+e[8]*z+e[12], wz = e[2]*x+e[6]*y+e[10]*z+e[14];
            if (wx<minX) minX=wx; if (wx>maxX) maxX=wx; if (wz<minZ) minZ=wz; if (wz>maxZ) maxZ=wz;
          }
        });
        if (!n) return;
        const soort = /theaterrij/i.test(naam) ? 'NIEUW' : 'orig';
        const k = soort + ' x' + Math.round((minX+maxX)/2/40)*40 + ' w' + Math.round(maxX-minX);
        (perKolom[k] = perKolom[k] || []).push(+((minZ+maxZ)/2).toFixed(0));
      }
    });
    for (const k of Object.keys(perKolom)) { const v = perKolom[k].sort((a,b)=>a-b); perKolom[k] = { rijen: v.length, z: v.join(',') }; }
    return perKolom;
  });
  console.log('kolommen:', JSON.stringify(telling));
  console.log('screenshots: ghtheater-achterin.png / ghtheater-vanafpodium.png / ghtheater-topdown.png');
} finally {
  await browser.close();
  server.kill();
}
