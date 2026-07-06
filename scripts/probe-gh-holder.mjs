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

  const out = await page.evaluate(() => {
    const app = window.__app;
    const scene = app._scene;
    // back-facing pillar rect
    const rects = [];
    scene.traverse((o) => { if (o.isMesh && /^Rectangle/.test(o.name||'') && o.parent && /NBC logo's pilaar/i.test(o.parent.name||'')) rects.push(o); });
    let plane = null, bestZ = -Infinity;
    for (const r of rects) { r.updateWorldMatrix(true,false); const z=r.matrixWorld.elements[14]; if(z>bestZ){bestZ=z;plane=r;} }
    const mat = Array.isArray(plane.material)?plane.material[0]:plane.material;
    // collect texture objects from material
    const texs = new Set(); const seen=new Set();
    const walk=(v,d)=>{ if(!v||typeof v!=='object'||d>8||seen.has(v))return; seen.add(v);
      if(v.isTexture){texs.add(v);return;}
      if(v instanceof Map){for(const x of v.values())walk(x,d+1);return;}
      if(Array.isArray(v)){for(const x of v)walk(x,d+1);return;}
      for(const k of Object.keys(v)){if(k.startsWith('__')||['parent','children','shared','thisContext'].includes(k))continue; if(v[k]&&typeof v[k]==='object')walk(v[k],d+1);}};
    walk(mat,0);
    // holders
    const cache = app._sharedAssetsManager.imageHolderCache.cache;
    const holders = cache instanceof Map ? [...cache.values()] : Object.values(cache);
    const holderTex = (h)=>{ const f=[]; const s=new Set(); const sc=(v,d)=>{ if(!v||typeof v!=='object'||d>6||s.has(v))return; s.add(v); if(v.isTexture){f.push(v);return;} if(v instanceof Map){for(const x of v.values())sc(x,d+1);return;} if(Array.isArray(v)){for(const x of v)sc(x,d+1);return;} for(const k of Object.keys(v)){if(k==='shared'||k==='thisContext')continue; sc(v[k],d+1);}}; sc(h._cache,0); return f; };
    const matched = [];
    holders.forEach((h,i)=>{
      const ht = holderTex(h);
      const hit = ht.filter(t=>texs.has(t));
      if(hit.length) matched.push({name: h.name||h.data&&h.data.name, texCount: ht.length, hits: hit.length});
    });
    return { planeName: plane.name, matName: mat.name, matType: mat.type, texCount: texs.size, matchedHolders: matched,
             allPilaren: holders.filter(h=>/logo pilaar/i.test(h.name||h.data&&h.data.name||'')).map(h=>({name:h.name||h.data.name, tex: holderTex(h).length})) };
  });
  console.log(JSON.stringify(out, null, 1));
} finally { await browser.close(); server.kill(); }
