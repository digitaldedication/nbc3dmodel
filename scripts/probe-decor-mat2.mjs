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
    const scene = window.__app._scene;
    const out = { schermenParent: null, deel1: null };

    const matInfo = (m) => {
      if (!m) return null;
      const layers = (m.layers && (m.layers.layers || m.layers)) || [];
      const list = [];
      for (const layer of (Array.isArray(layers) ? layers : [])) {
        const d = layer.data || {};
        const e = { type: d.type, visible: d.visible };
        if (Array.isArray(d.colors)) e.colors = d.colors.map((c) => Array.isArray(c) ? c.slice(0, 4).map((v) => +(+v).toFixed(2)) : c);
        if (d.color && typeof d.color === 'object' && 'r' in d.color) e.color = [d.color.r, d.color.g, d.color.b].map((v) => +v.toFixed(2));
        const u = layer.uniforms || {};
        e.uniformKeys = Object.keys(u).filter((k) => /color/i.test(k));
        for (const k of e.uniformKeys) {
          const v = u[k] && u[k].value;
          if (v && v.isColor) e[k] = [v.r, v.g, v.b].map((x) => +x.toFixed(2));
          else if (Array.isArray(v)) e[k] = v.map((s) => (s && 'x' in s) ? [s.x, s.y, s.z].map((x) => +x.toFixed(2)) : s).slice(0, 4);
        }
        list.push(e);
      }
      return { name: m.name, layerCount: list.length, layers: list };
    };

    scene.traverse((o) => {
      if (!out.schermenParent && (o.name || '') === 'Schermen') {
        const p = o.parent;
        out.schermenParent = {
          name: p && p.name, gp: p && p.parent && p.parent.name,
          siblings: p ? (p.children || []).map((c) => ({ name: c.name, isMesh: !!c.isMesh, kids: (c.children || []).length })) : null,
          kids: (o.children || []).map((c) => ({ name: c.name, isMesh: !!c.isMesh, matCount: Array.isArray(c.material) ? c.material.length : (c.material ? 1 : 0) })),
        };
      }
      if (/^Deel_/.test(o.name || '') && o.isMesh) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        out.deel1 = out.deel1 || {}; out.deel1[o.name + '#' + Object.keys(out.deel1).length] = { mats: mats.map(matInfo) };
      }
    });
    return out;
  });
  writeFileSync('scene-inspection/decor-mat2.json', JSON.stringify(rep, null, 1));
  console.log('OK');
} finally {
  await browser.close();
  server.kill();
}
