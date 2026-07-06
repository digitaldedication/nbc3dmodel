import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const key = process.argv[2] || 'congres';
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
  await page.goto(`http://127.0.0.1:8787/scripts/inspect.html?scene=${encodeURIComponent(`/assets/spline/${key}/scene.splinecode`)}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 180000 });

  const tree = await page.evaluate(() => {
    const app = window.__app;
    const lines = [];
    const walk = (o, depth) => {
      if (depth > 6) return;
      const kids = o.children ? o.children.length : 0;
      const tag = o.isMesh ? 'M' : o.isLight ? 'L' : o.type === 'Group' || o.isGroup ? 'G' : o.type;
      if (o.name || depth <= 3)
        lines.push(`${'  '.repeat(depth)}[${tag}] ${o.name || '(naamloos)'}${kids ? ` (${kids})` : ''}`);
      if (o.children) for (const c of o.children) walk(c, depth + 1);
    };
    walk(app._scene, 0);
    return lines.join('\n');
  });
  writeFileSync(`scene-inspection/${key}-tree.txt`, tree);
  console.log('geschreven: scene-inspection/' + key + '-tree.txt (' + tree.split('\n').length + ' regels)');
} finally {
  await browser.close();
  server.kill();
}
