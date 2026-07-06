import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const scenes = process.argv[2] ? [process.argv[2]] : ['congres', 'feest', 'sitdown', 'lounge'];
const outDir = process.env.OUT_DIR || 'scene-inspection';
mkdirSync(outDir, { recursive: true });

const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'inherit' });
await new Promise((r) => setTimeout(r, 800));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

try {
  for (const key of scenes) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    // Externe verzoeken lokaal afhandelen (netwerk is dicht in deze omgeving).
    // NB: laatst geregistreerde route wint, dus catch-all eerst.
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => {
      console.log(`[${key}] blocked-external:`, route.request().url());
      route.abort();
    });
    await page.route('**://www.gstatic.com/draco/**', (route) => {
      const file = route.request().url().split('/').pop();
      route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${file}` }).catch(() => route.abort());
    });
    await page.route('**://unpkg.com/@splinetool/**', (route) => {
      const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/);
      if (!m) return route.abort();
      route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort());
    });
    page.on('console', (m) => console.log(`[${key}]`, m.text()));
    page.on('pageerror', (e) => console.log(`[${key}] pageerror`, e.message));
    const url = `http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent(`/assets/spline/${key}/scene.splinecode`)}`;
    await page.goto(url);
    await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });
    const err = await page.evaluate('window.__error || null');
    if (err) {
      console.log(`[${key}] ERROR:`, err);
    } else {
      const report = await page.evaluate('window.__report');
      writeFileSync(`${outDir}/${key}.json`, JSON.stringify(report, null, 2));
      console.log(`[${key}] nodes=${report.nodeCount} materials=${report.materials.length} splineObjects=${report.splineObjects.length}`);
      await new Promise((r) => setTimeout(r, 2500)); // let it render a few frames
      await page.screenshot({ path: `${outDir}/${key}.png` });
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
