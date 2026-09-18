import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8787);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    let path = (req.url || '/').split('?')[0];
    if (path === '/') path = '/observatory/index.html';
    const file = join(root, path.replace(/^\//, ''));
    const st = await stat(file);
    if (!st.isFile()) { res.writeHead(404); res.end('not found'); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Observatory http://127.0.0.1:${port}/observatory/`);
  console.log(`Artifact   http://127.0.0.1:${port}/observatory/data/twin-run.json`);
});
