/**
 * Praxis Learn — API поверх data/db.json.
 *
 *   POST /api/auth/register  { email, password, name }
 *   POST /api/auth/login     { email, password }
 *   GET  /api/progress?userId=<id>
 *   POST /api/progress       { userId, lessonId, patch }
 *   GET  /api/drafts?userId=<id>&taskId=<id>
 *   POST /api/drafts         { userId, taskId, code }
 *   GET  /api/export         — весь дамп (для бэкапа / переноса)
 *   POST /api/import         — замена дампа целиком
 *
 * Пароли хэшируются crypto.subtle (SHA-256 + соль) на стороне сервера,
 * поэтому в db.json нет открытых паролей.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'data', 'db.json');

const EMPTY_DB = {
  version: 1,
  users: [],
  progress: {},
  drafts: {},
  meta: {},
};

const MAX_BODY = 20 * 1024 * 1024;

/* ------------------------------------------------------------------ дамп */

function ensureDataFile() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) writeRaw(EMPTY_DB);
}

function readRaw() {
  ensureDataFile();
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return { ...structuredClone(EMPTY_DB), ...parsed };
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

function writeRaw(obj) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

/* ---------------------------------------------------------------- утилиты */

function send(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => {
      raw += c;
      if (raw.length > MAX_BODY) { reject(new Error('payload too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/** Хэш пароля: SHA-256(salt + password), соль хранится рядом. */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(salt + password).digest('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const candidate = crypto.createHash('sha256').update(salt + password).digest('hex');
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(String(hash || ''), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function publicUser(u) {
  if (!u) return null;
  const { passwordHash, salt, ...rest } = u;
  return rest;
}

/* ------------------------------------------------------------------- API */

async function handleAuth(req, res, action) {
  const body = await readBody(req);
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) return send(res, 400, { error: 'email и password обязательны' });

  const db = readRaw();

  if (action === 'register') {
    if (password.length < 8) return send(res, 400, { error: 'пароль минимум 8 символов' });
    if (db.users.some(u => u.email === email)) {
      return send(res, 409, { error: 'такой email уже зарегистрирован' });
    }
    const { salt, hash } = hashPassword(password);
    const user = {
      id: uid('u_'),
      email,
      name: String(body.name || email.split('@')[0]).slice(0, 40),
      salt,
      passwordHash: hash,
      createdAt: Date.now(),
    };
    db.users.push(user);
    db.progress[user.id] ||= {};
    db.drafts[user.id] ||= {};
    writeRaw(db);
    return send(res, 201, { user: publicUser(user) });
  }

  // login
  const user = db.users.find(u => u.email === email);
  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
    return send(res, 401, { error: 'неверный email или пароль' });
  }
  return send(res, 200, { user: publicUser(user) });
}

async function handleProgress(req, res, url) {
  const db = readRaw();

  if (req.method === 'GET') {
    const userId = url.searchParams.get('userId');
    if (!userId) return send(res, 400, { error: 'нужен userId' });
    const map = db.progress[userId] || {};
    const list = Object.entries(map).map(([lessonId, p]) => ({ lessonId, ...p }));
    return send(res, 200, list);
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const { userId, lessonId, patch } = body;
    if (!userId || !lessonId || !patch) return send(res, 400, { error: 'userId, lessonId, patch обязательны' });

    db.progress[userId] ||= {};
    const prev = db.progress[userId][lessonId] || { status: 'not-started', tasks: {}, quiz: {} };
    db.progress[userId][lessonId] = {
      ...prev,
      ...patch,
      tasks: { ...(prev.tasks || {}), ...(patch.tasks || {}) },
      quiz: { ...(prev.quiz || {}), ...(patch.quiz || {}) },
      updatedAt: Date.now(),
    };
    writeRaw(db);
    return send(res, 200, db.progress[userId][lessonId]);
  }

  return send(res, 405, { error: 'method not allowed' });
}

async function handleDrafts(req, res, url) {
  const db = readRaw();

  if (req.method === 'GET') {
    const userId = url.searchParams.get('userId');
    const taskId = url.searchParams.get('taskId');
    if (!userId || !taskId) return send(res, 400, { error: 'нужны userId и taskId' });
    return send(res, 200, { code: db.drafts[userId]?.[taskId]?.code ?? '' });
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const { userId, taskId, code } = body;
    if (!userId || !taskId) return send(res, 400, { error: 'нужны userId и taskId' });
    db.drafts[userId] ||= {};
    db.drafts[userId][taskId] = { code: String(code ?? ''), updatedAt: Date.now() };
    writeRaw(db);
    return send(res, 200, { ok: true });
  }

  return send(res, 405, { error: 'method not allowed' });
}

/**
 * Единая точка входа. serve.mjs вызывает её для любого пути,
 * начинающегося с /api/.
 */
export async function handleApiRequest(req, res, url) {
  const route = url.pathname.replace(/^\/api\/?/, '');

  try {
    if (route === 'health') {
      const db = readRaw();
      return send(res, 200, {
        ok: true,
        name: 'praxis-learn',
        users: db.users.length,
        usersWithProgress: Object.keys(db.progress).filter(k => Object.keys(db.progress[k]).length).length,
      });
    }

    if (route.startsWith('auth/')) return await handleAuth(req, res, route.slice(5));
    if (route === 'progress') return await handleProgress(req, res, url);
    if (route === 'drafts') return await handleDrafts(req, res, url);

    if (route === 'export') {
      ensureDataFile();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="praxis-learn-backup.json"',
      });
      return fs.createReadStream(DATA_FILE).pipe(res);
    }

    if (route === 'import') {
      if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });
      const incoming = await readBody(req);
      if (!incoming || !Array.isArray(incoming.users)) {
        return send(res, 400, { error: 'ожидается JSON в формате /api/export' });
      }
      writeRaw({ ...structuredClone(EMPTY_DB), ...incoming });
      return send(res, 200, { ok: true, users: incoming.users.length });
    }

    // Совместимость со старым клиентом: /api/data — сырой db.json целиком.
    if (route === 'data') {
      if (req.method === 'GET' || req.method === 'HEAD') {
        ensureDataFile();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        return fs.createReadStream(DATA_FILE).pipe(res);
      }
      if (req.method === 'POST' || req.method === 'PUT') {
        const body = await readBody(req);
        writeRaw({ ...structuredClone(EMPTY_DB), ...body });
        return send(res, 200, { ok: true });
      }
      return send(res, 405, { error: 'method not allowed' });
    }

    return send(res, 404, { error: 'неизвестный ресурс' });
  } catch (err) {
    return send(res, 500, { error: String(err?.message || err) });
  }
}

/* ------------------------------------------- прямой запуск: node api/data.js */

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  ensureDataFile();
  console.log(DATA_FILE);
}

