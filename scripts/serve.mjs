import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const root = process.cwd();
const port = Number(process.env.PORT || 8787);
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.splinecode': 'application/octet-stream',
  '.wasm': 'application/wasm',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  // simuleer GitHub Pages-subpad (…github.io/nbc3dmodel/…)
  path = path.replace(/^nbc3dmodel[/\\]?/, '');
  let file = join(root, path);
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404); res.end('not found: ' + path); return; }
  res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log('serving', root, 'on http://127.0.0.1:' + port));
