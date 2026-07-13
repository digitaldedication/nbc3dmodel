import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const preset = process.argv[2] || 'boeken';
const server = spawn('node', ['scripts/serve.mjs'], { stdio: 'ignore', cwd: '/home/user/nbc3dmodel' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log('[page]', m.text().slice(0, 200)); });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
  await page.route('**://www.gstatic.com/draco/**', (route) => { const f = route.request().url().split('/').pop(); route.fulfill({ path: `node_modules/three/examples/jsm/libs/draco/${f}` }).catch(() => route.abort()); });
  await page.route('**://unpkg.com/@splinetool/**', (route) => { const m = route.request().url().match(/@splinetool\/([a-z-]+)@[^/]+\/(.+)$/); if (!m) return route.abort(); route.fulfill({ path: `node_modules/@splinetool/${m[1]}/${m[2]}` }).catch(() => route.abort()); });
  const cfg = {
    colors: { primary: '#E4032E', secondary: '#1B2A7B' },
    eventhall: { type: 'preset:' + preset, logoSpots: 0, logo: false },
    scene: 'congres',
    scenes: ['congres'],
  };
  const packed = Buffer.from(JSON.stringify(cfg)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await page.goto('http://127.0.0.1:8787/viewer/#c=' + packed);
  await page.waitForFunction(() => {
    const s = document.getElementById('status');
    return s && s.classList.contains('hidden');
  }, null, { timeout: 240000 });
  await new Promise((r) => setTimeout(r, 5000));
  await page.screenshot({ path: 'scene-inspection/test-decor-' + preset + '.png', timeout: 120000 });
  console.log('OK scene-inspection/test-decor-' + preset + '.png');
} finally {
  await browser.close();
  server.kill();
}
