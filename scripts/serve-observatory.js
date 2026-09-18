import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'observatory');
const port = Number(process.env.PORT || 8787);

createServer(async (req, res) => {
  const path = req.url === '/' ? '/index.html' : req.url;
  try {
    const data = await readFile(join(root, path.replace(/\?.*$/, '')));
    res.writeHead(200, { 'Content-Type': path.endsWith('.html') ? 'text/html' : 'text/plain' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}).listen(port, () => console.log(`Observatory http://127.0.0.1:${port}/`));
