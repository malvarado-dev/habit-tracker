// Serves the web build (dist/) for Playwright, at the same /habit-tracker path GitHub Pages uses
// (app.json experiments.baseUrl), so tests see exactly what ships. No extra packages: plain Node.
// Usage: node scripts/serve-web.mjs [port]. Playwright starts it for you (playwright.config.ts).

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('dist');
const base = '/habit-tracker';
const port = Number(process.argv[2] ?? 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

/** The file for a URL path: the exact file, then path.html, then the app's index page. */
function fileFor(urlPath) {
  const inside = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const candidates = [
    join(root, inside),
    join(root, `${inside}.html`),
    join(root, inside, 'index.html'),
  ];
  const found = candidates.find((p) => p.startsWith(root) && existsSync(p) && statSync(p).isFile());
  return found ?? join(root, 'index.html');
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (!url.pathname.startsWith(base)) {
    res.writeHead(302, { Location: `${base}/` }).end();
    return;
  }
  const file = fileFor(url.pathname.slice(base.length) || '/');
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving dist at http://localhost:${port}${base}/`));
