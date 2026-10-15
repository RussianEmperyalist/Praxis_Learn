const CACHE = new Map();

async function loadJSON(path) {
  if (CACHE.has(path)) return CACHE.get(path);
  const res = await fetch(path, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Не удалось загрузить ${path}: ${res.status}`);
  const data = await res.json();
  CACHE.set(path, data);
  return data;
}

export const content = {
  async getCourses() {
    const idx = await loadJSON('./content/courses.json');
    return idx.courses;
  },

  async getCourse(courseId) {
    const courses = await this.getCourses();
    const c = courses.find(x => x.id === courseId);
    if (!c) throw new Error(`Курс "${courseId}" не найден`);
    return c;
  },

  async getLessonsIndex(courseId) {
    const course = await this.getCourse(courseId);
    return loadJSON(`./content/${courseId}/index.json`);
  },

  async getLesson(courseId, lessonId) {
    return loadJSON(`./content/${courseId}/${lessonId}.json`);
  },
};

