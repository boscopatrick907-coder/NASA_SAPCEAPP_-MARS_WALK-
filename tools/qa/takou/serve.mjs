// Zero-dependency static server for the production build (Takou release QA).
// Mirrors vercel.json: filesystem only, no SPA fallback (missing paths return 404),
// no-store for entry/worker/pack, no-cache for manifest/icons/data, nosniff everywhere.
// Usage: node tools/qa/takou/serve.mjs [--root dist/marswalk/browser] [--port 4310]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};
const NO_STORE = new Set(['/', '/index.html', '/service-worker.js', '/offline-pack.json']);

function cacheControl(path) {
  if (NO_STORE.has(path)) return 'no-store';
  if (path === '/manifest.webmanifest' || path.startsWith('/icons/') || path.startsWith('/data/'))
    return 'no-cache';
  return null;
}

/** Starts the server and resolves to { url, close(), requests } once listening. */
export function startServer({
  root = 'dist/marswalk/browser',
  port = 4310,
  host = '127.0.0.1',
} = {}) {
  const base = resolve(root);
  const requests = [];
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://local').pathname);
    let status = 404;
    try {
      const file = normalize(join(base, path === '/' ? 'index.html' : path));
      if (file !== base && !file.startsWith(base + sep)) throw new Error('outside root');
      const info = await stat(file);
      if (!info.isFile()) throw new Error('not a file');
      const body = await readFile(file);
      status = 200;
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader(
        'Content-Type',
        TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
      );
      const cache = cacheControl(path);
      if (cache) res.setHeader('Cache-Control', cache);
      res.writeHead(200);
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
    requests.push({ method: req.method, path, status });
  });
  return new Promise((resolveStart, reject) => {
    server.once('error', reject);
    server.listen(port, host, () =>
      resolveStart({
        url: `http://${host}:${port}/`,
        requests,
        close: () =>
          new Promise((done) => {
            server.closeAllConnections?.();
            server.close(() => done());
          }),
      }),
    );
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name, fallback) => {
    const i = process.argv.indexOf(name);
    return i > 0 ? process.argv[i + 1] : fallback;
  };
  const { url } = await startServer({
    root: arg('--root', undefined),
    port: Number(arg('--port', 4310)),
  });
  console.log(`Serving production build at ${url} (Ctrl+C to stop)`);
}
