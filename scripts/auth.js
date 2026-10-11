/**
 * Praxis Learn — модуль авторизации.
 *
 * Аккаунты живут в data/db.json рядом с проектом: папку можно перенести
 * на другой компьютер вместе со всеми пользователями. В браузере хранится
 * только отметка о текущем входе.
 */
const LS_USER = 'praxis_user';

/** Сервер отдаёт поле `name`, интерфейс ожидает `username` — приводим. */
function normalize(user) {
  if (!user) return null;
  return { ...user, username: user.username || user.name || 'студент' };
}

async function call(path, body) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Сервер недоступен. Запусти проект: node serve.mjs');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Операция не удалась');
  return data;
}

export const auth = {
  async register({ email, password, username }) {
    const data = await call('/api/auth/register', { email, password, name: username });
    const user = normalize(data.user);
    localStorage.setItem(LS_USER, JSON.stringify(user));
    return user;
  },

  async login({ email, password }) {
    const data = await call('/api/auth/login', { email, password });
    const user = normalize(data.user);
    localStorage.setItem(LS_USER, JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem(LS_USER);
  },

  /** Всегда возвращает Promise — страницы ждут через await или .then(). */
  async current() {
    try {
      const raw = localStorage.getItem(LS_USER);
      return raw ? normalize(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  },
};
