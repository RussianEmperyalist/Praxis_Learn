/**
 * Praxis Learn — клиент доступа к данным.
 *
 * Всё постоянное живёт в data/db.json на стороне сервера (serve.mjs +
 * api/data.js). Здесь только HTTP-обёртка над /api/* и кэш текущего
 * пользователя в localStorage.
 *
 * Если сервер не запущен (открыли index.html двойным кликом), loadDb()
 * бросает понятную ошибку — страницы показывают её вместо тихой потери
 * прогресса.
 */

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...options,
  });

  let payload = null;
  const text = await res.text();
  try { payload = text ? JSON.parse(text) : null; } catch { payload = null; }

  if (!res.ok) {
    const detail = payload?.error || payload?.message || text?.slice(0, 160) || res.statusText;
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  return payload;
}

const API_DOWN = new Error(
  'Сервер данных недоступен. Запустите `node serve.mjs` и откройте http://localhost:3000',
);

/**
 * Вход/регистрация живут в auth.js — здесь только данные: прогресс,
 * черновики кода и перенос базы между машинами.
 */
export const storage = {
  /* ----------------------------------------------------------- прогресс */


  /** @returns {Promise<Array<{lessonId, status, tasks, quiz, updatedAt}>>} */
  async getAllProgress(userId) {
    try {
      return await request(`/api/progress?userId=${encodeURIComponent(userId)}`) || [];
    } catch (err) {
      if (err.status) throw err;
      throw API_DOWN;
    }
  },

  async getProgress(userId, lessonId) {
    const all = await this.getAllProgress(userId);
    return all.find(p => p.lessonId === lessonId) || null;
  },

  /**
   * Частичное обновление прогресса урока. `patch` сливается с сохранённым
   * состоянием, tasks/quiz — по ключам.
   */
  async setProgress(userId, lessonId, patch) {
    return request('/api/progress', {
      method: 'POST',
      body: JSON.stringify({ userId, lessonId, patch }),
    });
  },

  /* --------------------------------------------------------- черновики */

  /** @returns {Promise<string>} сохранённый код (пустая строка, если нет) */
  async getDraft(userId, taskId) {
    try {
      const r = await request(
        `/api/drafts?userId=${encodeURIComponent(userId)}&taskId=${encodeURIComponent(taskId)}`,
      );
      return r?.code ?? '';
    } catch (err) {
      if (err.status) throw err;
      throw API_DOWN;
    }
  },

  async saveDraft(userId, taskId, code) {
    return request('/api/drafts', {
      method: 'POST',
      body: JSON.stringify({ userId, taskId, code }),
    });
  },

  /* ------------------------------------------------------ экспорт/импорт */

  /** Полный дамп db.json — для бэкапа и переноса между машинами. */
  async exportAll() {
    try {
      return await request('/api/export');
    } catch (err) {
      if (err.status) throw err;
      throw API_DOWN;
    }
  },

  async importAll(db) {
    return request('/api/import', { method: 'POST', body: JSON.stringify(db) });
  },

  /** Проверка, что сервер данных жив. */
  async health() {
    try {
      return await request('/api/health');
    } catch {
      return null;
    }
  },
};
