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

  const rep = await page.evaluate(async () => {
    const app = window.__app;
    const scene = app._scene;
    const { listImageAssets, findGrandHallPlane } = await import('/src/branding.js');
    const assets = listImageAssets(app);
    const ghInfo = findGrandHallPlane(app, assets.filter((a) => /logo pilaar/i.test(a.name || '')));
    // event hall-mesh vinden
    let ehMesh = null;
    scene.traverse((o) => { if (!ehMesh && o.isMesh && /^Deel/.test((o.name || '').trim())) ehMesh = o; });
    const uniforms = (mesh) => {
      const m = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const ls = (m.layers && (m.layers.layers || m.layers)) || [];
      return ls.map((l) => ({
        type: l.type || (l.data && l.data.type),
        uniforms: l.uniforms ? Object.fromEntries(Object.entries(l.uniforms).map(([k, v]) => {
          const val = v && v.value;
          let s;
          if (val == null) s = String(val);
          else if (val.isTexture) s = '<texture>';
          else if (val.isVector2) s = `v2(${val.x},${val.y})`;
          else if (val.isVector3) s = `v3(${val.x},${val.y},${val.z})`;
          else if (val.isVector4) s = `v4(${val.x},${val.y},${val.z},${val.w})`;
          else if (val.isMatrix3) s = 'm3[' + val.elements.map((e) => +e.toFixed(3)).join(',') + ']';
          else if (Array.isArray(val)) s = 'arr(' + val.length + ')';
          else s = String(val).slice(0, 40);
          return [k, s];
        })) : null,
      }));
    };
    const m = Array.isArray(ehMesh.material) ? ehMesh.material[0] : ehMesh.material;
    const own = Object.keys(m);
    const proto = [];
    for (let o = Object.getPrototypeOf(m); o && o !== Object.prototype; o = Object.getPrototypeOf(o)) proto.push(...Object.getOwnPropertyNames(o));
    return { own, proto: [...new Set(proto)].slice(0, 60), hasUniforms: !!m.uniforms, uniformKeys: m.uniforms ? Object.keys(m.uniforms).filter((k) => /^f\d/.test(k)) : null, allCount: m.uniforms ? Object.keys(m.uniforms).length : 0, type: m.type, ctor: m.constructor && m.constructor.name };
  });
  console.log(JSON.stringify(rep, null, 1));
} finally {
  await browser.close();
  server.kill();
}
