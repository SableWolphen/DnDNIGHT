import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(root) || !['/index.html', '/styles.css'].includes(pathname === '/' ? '/index.html' : pathname) && !path.startsWith(resolve(root, 'src') + sep)) {
      res.writeHead(404).end('Not found'); return;
    }
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': (types[extname(path)] || 'text/plain') + '; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log('DnD Night: http://localhost:' + (process.env.PORT || 3000)));
