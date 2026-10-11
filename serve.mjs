#!/usr/bin/env node
/**
 * Praxis Learn — локальный сервер.
 *
 * Раздаёт статику и реализует API:
 *   /api/auth/register  — регистрация
 *   /api/auth/login     — вход
 *   /api/progress       — прогресс (GET/POST)
 *   /api/drafts         — черновики (GET/POST)
 *   /api/export         — скачивание дампа базы
 *   /api/import         — восстановление из дампа
 *
 *   node serve.mjs [порт]
 *   # http://localhost:3000
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './api/data.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2]) || Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(ROOT, 'data');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const rawUrl = req.url || '/';
  const url = new URL(rawUrl, 'http://localhost');
  const pathname = url.pathname;

  // --- API ---
  if (pathname.startsWith('/api/')) {
    return handleApiRequest(req, res, url);
  }

  // --- Статика: не отдаём data/ напрямую (там пароли) ---
  const p = path.normalize(path.join(ROOT, pathname === '/' ? 'index.html' : pathname));
  if (p !== ROOT && !p.startsWith(ROOT + path.sep) || p.startsWith(DATA_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 Forbidden');
  }

  fs.stat(p, (err, st) => {
    const file = !err && st.isDirectory() ? path.join(p, 'index.html') : p;
    fs.readFile(file, (e, buf) => {
      if (e) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not found');
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(buf);
    });
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Praxis Learn // LOCAL SERVER');
  console.log(`  http://localhost:${PORT}`);
  console.log(`  база данных: ${path.join(ROOT, 'data', 'db.json')}`);
  console.log('');
});
