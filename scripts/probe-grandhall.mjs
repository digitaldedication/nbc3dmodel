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
  await page.route('**://www.gstatic.com/draco/**', (route) => {
    const file = route.request().url().split('/').pop();
    route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${file}` }).catch(() => route.abort());
  });
  await page.route('**://unpkg.com/@splinetool/**', (route) => {
    const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/);
    if (!m) return route.abort();
    route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort());
  });
  await page.goto(`http://127.0.0.1:8787/scripts/test-branding.html?scene=${encodeURIComponent('/assets/spline/congres/scene.splinecode')}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
  await page.evaluate('window.__applyBranding()');
  await page.waitForFunction('window.__branded === true', null, { timeout: 60000 });

  const report = await page.evaluate(() => {
    const app = window.__app;
    const scene = app._scene;
    const wb = (mesh) => {
      if (!mesh.geometry) return null;
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      mesh.updateWorldMatrix(true, false);
      const bb = mesh.geometry.boundingBox; const e = mesh.matrixWorld.elements;
      const min = {x:1e9,y:1e9,z:1e9}, max={x:-1e9,y:-1e9,z:-1e9};
      for (const x of [bb.min.x,bb.max.x]) for (const y of [bb.min.y,bb.max.y]) for (const z of [bb.min.z,bb.max.z]) {
        const p = {x:e[0]*x+e[4]*y+e[8]*z+e[12], y:e[1]*x+e[5]*y+e[9]*z+e[13], z:e[2]*x+e[6]*y+e[10]*z+e[14]};
        for (const k of ['x','y','z']){min[k]=Math.min(min[k],p[k]);max[k]=Math.max(max[k],p[k]);}
      }
      return {size:{x:+(max.x-min.x).toFixed(1),y:+(max.y-min.y).toFixed(1),z:+(max.z-min.z).toFixed(1)},
              center:{x:+((min.x+max.x)/2).toFixed(1),y:+((min.y+max.y)/2).toFixed(1),z:+((min.z+max.z)/2).toFixed(1)}};
    };
    let cube=null, plane=null, welkom=null, midden=null;
    scene.traverse((o)=>{
      if((o.name||'').trim()==='Scherm midden' && !midden) midden=o;
      if(o.name==='brand-logo-grandhall') plane=o;
      if(o.isMesh && (o.name||'').trim()==='Welkom') welkom=o;
    });
    if(midden) midden.traverse((o)=>{ if(o.isMesh && /^Cube/.test((o.name||'').trim()) && !cube) cube=o; });
    // texture image van de plane
    let planeImg=null;
    if(plane){
      const mat = Array.isArray(plane.material)?plane.material[0]:plane.material;
      const seen=new Set();
      const find=(v,d)=>{ if(!v||typeof v!=='object'||d>8||seen.has(v))return; seen.add(v);
        if(v.isTexture){ const im=v.image; if(im&&!planeImg) planeImg={w:im.width,h:im.height,tag:im.tagName||im.constructor.name}; return;}
        if(v instanceof Map){for(const x of v.values())find(x,d+1);return;}
        if(Array.isArray(v)){for(const x of v)find(x,d+1);return;}
        for(const k of Object.keys(v)){if(k.startsWith('__')||['parent','children','shared','thisContext'].includes(k))continue; if(v[k]&&typeof v[k]==='object')find(v[k],d+1);}};
      find(mat,0);
    }
    return {
      cube: cube?{name:cube.name, box:wb(cube)}:null,
      midden: midden?{children:midden.children.map(c=>c.name)}:null,
      plane: plane?{name:plane.name, box:wb(plane), img:planeImg, visible:plane.visible}:null,
      welkomVisible: welkom?welkom.visible:null,
    };
  });
  console.log(JSON.stringify(report, null, 1));
} finally {
  await browser.close();
  server.kill();
}
