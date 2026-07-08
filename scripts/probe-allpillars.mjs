import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const scenes = ['congres', 'feest', 'sitdown'];
const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  for (const key of scenes) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
    await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
    await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent(`/assets/spline/${key}/scene.splinecode`)}`);
    await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
    await new Promise((r) => setTimeout(r, 8000));
    const rep = await page.evaluate(() => {
      const scene = window.__app._scene;
      const wbox = (m) => {
        m.updateWorldMatrix(true, false);
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        const bb = m.geometry.boundingBox, e = m.matrixWorld.elements;
        let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
        for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
          const w = [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]];
          for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], w[k]); mx[k] = Math.max(mx[k], w[k]); }
        }
        return { ymin: +mn[1].toFixed(1), ymax: +mx[1].toFixed(1), h: +(mx[1] - mn[1]).toFixed(1) };
      };
      const out = [];
      scene.traverse((g) => {
        if (!/NBC logo's pilaar/i.test(g.name || '')) return;
        const pillar = g.parent && (g.parent.children || []).find((s) => s.isMesh && /^Pilaar/.test(s.name || ''));
        const plane = (g.children || []).find((c) => c.isMesh);
        out.push({
          parent: g.parent && g.parent.name,
          pillarName: pillar && pillar.name,
          pillar: pillar ? wbox(pillar) : null,
          plane: plane ? wbox(plane) : null,
          pillarGeom: pillar && pillar.data && pillar.data.geometry ? { h: pillar.data.geometry.height, w: pillar.data.geometry.width, d: pillar.data.geometry.depth } : null,
          pillarScale: pillar && pillar.data ? pillar.data.scale : null,
        });
      });
      return out;
    });
    console.log('=== ' + key + ' ===');
    for (const r of rep) {
      console.log(`${(r.parent || '?').padEnd(30)} ${(r.pillarName || '-').padEnd(10)} pilaar[${r.pillar ? r.pillar.ymin + '..' + r.pillar.ymax + ' h' + r.pillar.h : '-'}] vlak[${r.plane ? r.plane.ymin + '..' + r.plane.ymax + ' h' + r.plane.h : '-'}] geomH=${r.pillarGeom && r.pillarGeom.h} scale=${JSON.stringify(r.pillarScale)}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
