// Wereldmaten van de pilaar-bandvlakken NA applyPillarBandPose: zo zien we
// exact welk gebied (lengte × breedte, wereld) het logocanvas beslaat.
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
  page.on('console', (m) => console.log('[page]', m.text()));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 5000));

  const out = await page.evaluate(async () => {
    const app = window.__app;
    const measure = () => {
      const rows = [];
      app._scene.traverse((group) => {
        if (!/NBC logo's pilaar/i.test(group.name || '')) return;
        for (const r of (group.children || [])) {
          if (!r.isMesh || !r.visible) continue;
          if (!r.geometry.boundingBox) r.geometry.computeBoundingBox();
          r.updateWorldMatrix(true, false);
          const bb = r.geometry.boundingBox;
          const gs = { x: bb.max.x - bb.min.x, y: bb.max.y - bb.min.y };
          const e = r.matrixWorld.elements;
          const sx = Math.hypot(e[0], e[1], e[2]);
          const sy = Math.hypot(e[4], e[5], e[6]);
          rows.push({
            name: r.name, rot: +((r.rotation && r.rotation.y) || 0).toFixed(2),
            geom: [ +gs.x.toFixed(2), +gs.y.toFixed(2) ],
            world: [ +(gs.x * sx).toFixed(3), +(gs.y * sy).toFixed(3) ],
            hm05: Array.isArray(r.data && r.data.hiddenMatrix) ? [ +(+r.data.hiddenMatrix[0]).toFixed(3), +(+r.data.hiddenMatrix[5]).toFixed(3) ] : null,
          });
        }
      });
      return rows.slice(0, 3);
    };
    const before = measure();
    const sq = document.createElement('canvas');
    sq.width = 512; sq.height = 512;
    sq.getContext('2d').fillRect(0, 0, 512, 512);
    const { applyBranding } = await import('/src/branding.js');
    await applyBranding(app, {
      colors: { primary: '#E4032E', secondary: '#E4032E' },
      pillarLogo: sq.toDataURL('image/png'),
      pillarLogoPos: 'midden',
    });
    await new Promise((r) => setTimeout(r, 1500));
    const after = measure();
    return { before, after };
  });
  console.log(JSON.stringify(out, null, 2));
} finally {
  await browser.close();
  server.kill();
}
