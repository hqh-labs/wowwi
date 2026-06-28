/**
 * BUILD-15 Preview Server
 *
 * Serves the static preview dist using Node's built-in http module.
 * No external dependencies required.
 *
 * Usage: node apps/internal-preview/scripts/serve-preview.mjs [port]
 */

import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(HERE, '..');
const DIST = path.join(APP_ROOT, 'dist');

const PORT = parseInt(process.argv[2] ?? '4174', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

if (!existsSync(DIST)) {
  console.error('ERROR: Preview dist not found. Run: npm run preview:build');
  process.exit(1);
}

const server = createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = path.join(DIST, urlPath);
  // Security: prevent path traversal outside DIST
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] ?? 'application/octet-stream';

  if (!existsSync(filePath)) {
    // Try index.html fallback for directories
    const fallback = path.join(filePath, 'index.html');
    if (existsSync(fallback)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      createReadStream(fallback).pipe(res);
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`<h1>404 Not Found</h1><p>${urlPath}</p>`);
    return;
  }

  res.writeHead(200, { 'Content-Type': mime });
  createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\nWowwi Internal Preview — BUILD-15`);
  console.log(`─`.repeat(40));
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`\nPress Ctrl+C to stop.\n`);
});
