import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });

  const rep = await page.evaluate(() => {
    const app = window.__app;
    const scene = app._scene;
    let pillar = null;
    scene.traverse((o) => { if (!pillar && o.isMesh && /^Pilaar/.test((o.name || '').trim())) pillar = o; });
    if (!pillar) return 'geen pilaar';
    const g = pillar.geometry;
    const pos = g.attributes.position, uv = g.attributes.uv;
    const idx = g.index ? Array.from(g.index.array) : null;
    // groepeer per driehoek/vlak: normaalrichting via posities
    const verts = [];
    for (let i = 0; i < pos.count; i++) {
      verts.push({
        p: [pos.getX(i).toFixed(2), pos.getY(i).toFixed(2), pos.getZ(i).toFixed(2)],
        uv: uv ? [uv.getX(i).toFixed(3), uv.getY(i).toFixed(3)] : null,
      });
    }
    return { name: pillar.name, count: pos.count, indexCount: idx ? idx.length : 0, hasUv: !!uv, verts: verts.slice(0, 40) };
  });
  console.log(JSON.stringify(rep, null, 1));
} finally {
  await browser.close();
  server.kill();
}
