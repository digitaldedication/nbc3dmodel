import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

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

  const rep = await page.evaluate(() => {
    const app = window.__app;
    const scene = app._scene;
    const out = { pillarGroups: [], screens: [], decor: [] };

    const layerSummary = (m) => {
      const res = [];
      if (m && Array.isArray(m.layers)) {
        for (const layer of m.layers) {
          const d = layer && layer.data;
          if (!d) continue;
          const e = { type: d.type };
          if (Array.isArray(d.colors)) e.colors = d.colors.map((c) => Array.isArray(c) ? c.slice(0, 3).map((v) => +v.toFixed(2)) : c);
          if (d.color && typeof d.color === 'object' && 'r' in d.color) e.color = [d.color.r, d.color.g, d.color.b].map((v) => +v.toFixed(2));
          if (d.texture) e.texture = true;
          res.push(e);
        }
      }
      return res;
    };

    scene.traverse((o) => {
      if (/NBC logo's pilaar/i.test(o.name || '') && out.pillarGroups.length < 2) {
        const kids = (o.children || []).map((r, i) => ({
          i, name: r.name, isMesh: !!r.isMesh,
          hm: Array.isArray(r.data && r.data.hiddenMatrix) ? [r.data.hiddenMatrix[0], r.data.hiddenMatrix[5], r.data.hiddenMatrix[10], r.data.hiddenMatrix[12], r.data.hiddenMatrix[13], r.data.hiddenMatrix[14]].map((v) => +v.toFixed(2)) : null,
          geomType: r.data && r.data.geometry && r.data.geometry.type,
          size: r.data && r.data.geometry && [r.data.geometry.width, r.data.geometry.height, r.data.geometry.depth],
          pos: r.position && [r.position.x, r.position.y, r.position.z].map((v) => +v.toFixed(1)),
          rot: r.rotation && [r.rotation.x, r.rotation.y, r.rotation.z].map((v) => +v.toFixed(2)),
        }));
        out.pillarGroups.push({ group: o.name, parent: o.parent && o.parent.name, kids });
      }
      // Grand Hall schermen/wanden
      if (o.isMesh && /scherm/i.test(o.name || '') && !/event\s*hall/i.test(o.name || '')) {
        out.screens.push({ name: o.name, parent: o.parent && o.parent.name, gp: o.parent && o.parent.parent && o.parent.parent.name, layers: layerSummary(o.material) });
      }
      // Event hall decor meshes
      if (o.isMesh && (/deel/i.test(o.name || '') || /event\s*hall\s*scherm/i.test((o.parent && o.parent.name) || '') || /decor/i.test(o.name || ''))) {
        out.decor.push({ name: o.name, parent: o.parent && o.parent.name, layers: layerSummary(o.material) });
      }
    });
    return out;
  });
  writeFileSync('scene-inspection/inspect3.json', JSON.stringify(rep, null, 1));
  console.log('pillarGroups:', rep.pillarGroups.length, 'screens:', rep.screens.length, 'decor:', rep.decor.length);
} finally {
  await browser.close();
  server.kill();
}
