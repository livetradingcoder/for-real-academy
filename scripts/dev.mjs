// Local dev server: serves the static site and runs api/*.js handlers like Vercel does.
// Usage: DATABASE_URL=... SESSION_SECRET=... node scripts/dev.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2] || process.env.PORT || 8792);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const file = path.join(root, url.pathname.replace(/\/$/, '') + '.js');
      if (url.pathname.includes('/_lib') || !file.startsWith(path.join(root, 'api')) || !fs.existsSync(file)) { res.writeHead(404).end('{"error":"not found"}'); return; }
      const mod = await import(pathToFileURL(file).href);
      const handler = mod[req.method];
      if (!handler) { res.writeHead(405).end('{"error":"method not allowed"}'); return; }
      const chunks = []; for await (const c of req) chunks.push(c);
      const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
      const r = await handler(request);
      const headers = {}; r.headers.forEach((v, k) => { headers[k] = v; });
      if (r.headers.getSetCookie?.().length) headers['set-cookie'] = r.headers.getSetCookie();
      res.writeHead(r.status, headers).end(Buffer.from(await r.arrayBuffer()));
      return;
    }
    let p = path.join(root, decodeURIComponent(url.pathname));
    if (!p.startsWith(root)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) { res.writeHead(404, { 'content-type': types['.html'] }).end(fs.readFileSync(path.join(root, '404.html'))); return; }
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }).end(fs.readFileSync(p));
  } catch (e) { console.error(e); res.writeHead(500).end('{"error":"server error"}'); }
}).listen(port, () => console.log(`dev server on http://localhost:${port}`));
