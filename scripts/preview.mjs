import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('out'),
  base = '/poker-squid-lab/';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!path.startsWith(base)) {
      res.writeHead(302, { Location: base });
      res.end();
      return;
    }
    const file = resolve(root, path.slice(base.length) + (path.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(root + sep)) throw Error();
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(8864, '127.0.0.1', () =>
  console.log('Squid Lab: http://127.0.0.1:8864/poker-squid-lab/'),
);
