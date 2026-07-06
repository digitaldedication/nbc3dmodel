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
  page.on('console', (m) => console.log('page:', m.text().slice(0, 200)));
  await page.goto(`http://127.0.0.1:8787/scripts/test-branding.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await page.evaluate('window.__applyBranding()');
  await page.waitForFunction('window.__branded === true', null, { timeout: 120000 });
  await new Promise((r) => setTimeout(r, 2000));

  // huidige transform dumpen
  const info = await page.evaluate(() => {
    let plane = null;
    window.__app._scene.traverse((o) => { if (!plane && o.name === 'brand-logo-grandhall') plane = o; });
    window.__plane = plane;
    return {
      pos: plane.position.toArray().map((v) => +v.toFixed(2)),
      scale: plane.scale.toArray().map((v) => +v.toFixed(3)),
      quat: plane.quaternion.toArray().map((v) => +v.toFixed(3)),
      matrixAutoUpdate: plane.matrixAutoUpdate,
    };
  });
  console.log('plane transform:', JSON.stringify(info));

  // schaal via de PUBLIEKE Spline-proxy zetten (interne datamodel-sync)
  const proxyInfo = await page.evaluate(() => {
    const app = window.__app;
    const plane = window.__plane;
    const proxy = app.getAllObjects().find((o) => o.uuid === plane.uuid);
    if (!proxy) return { found: false };
    // gewenste schaal stond al in plane.scale (decompose); zet hem op de proxy
    proxy.scale.x = plane.scale.x;
    proxy.scale.y = plane.scale.y;
    proxy.scale.z = plane.scale.z;
    if (app.requestRender) app.requestRender();
    return { found: true, scale: [proxy.scale.x, proxy.scale.y, proxy.scale.z].map((v) => +v.toFixed(2)) };
  });
  console.log('proxy:', JSON.stringify(proxyInfo));
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: 'scene-inspection/tune-1.png', clip: { x: 330, y: 180, width: 290, height: 160 }, timeout: 120000 });

  // geometry-verts IN PLACE schalen (geen kloon) — check eerst delen
  console.log('geo:', JSON.stringify(await page.evaluate(() => {
    const app = window.__app;
    const plane = window.__plane;
    // hoeveel andere meshes delen deze geometry?
    let sharers = 0;
    app._scene.traverse((o) => { if (o.isMesh && o !== plane && o.geometry === plane.geometry) sharers++; });
    const pos = plane.geometry.attributes.position;
    const sx = plane.scale.x, sy = plane.scale.y, sz = plane.scale.z;
    if (sharers === 0) {
      for (let i = 0; i < pos.count; i++) {
        pos.setXYZ(i, pos.getX(i) * sx, pos.getY(i) * sy, pos.getZ(i) * sz);
      }
      pos.needsUpdate = true;
      plane.geometry.computeBoundingBox(); plane.geometry.computeBoundingSphere();
      plane.scale.set(1, 1, 1); plane.updateMatrix(); plane.updateWorldMatrix(true, false);
    }
    if (app.requestRender) app.requestRender();
    return { sharers, verts: pos.count, sx: +sx.toFixed(2), sy: +sy.toFixed(2) };
  })));
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: 'scene-inspection/tune-geo.png', clip: { x: 330, y: 180, width: 290, height: 160 }, timeout: 120000 });

  // is de blob ons vlak? verberg hem via de proxy
  console.log('hide:', JSON.stringify(await page.evaluate(() => {
    const app = window.__app;
    const proxy = app.getAllObjects().find((o) => o.uuid === window.__plane.uuid);
    proxy.visible = false;
    if (app.requestRender) app.requestRender();
    return { visible: proxy.visible };
  })));
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: 'scene-inspection/tune-2.png', clip: { x: 330, y: 180, width: 290, height: 160 }, timeout: 120000 });
} finally {
  await browser.close();
  server.kill();
}
