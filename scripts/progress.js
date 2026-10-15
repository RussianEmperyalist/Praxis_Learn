import { storage } from './storage.js';

export const progress = {
  async markStarted(userId, lessonId) {
    const p = await storage.getProgress(userId, lessonId);
    if (!p || p.status === 'not-started') {
      await storage.setProgress(userId, lessonId, { status: 'in-progress' });
    }
  },

  async completeLesson(userId, lessonId) {
    return storage.setProgress(userId, lessonId, { status: 'completed' });
  },

  async setTaskResult(userId, lessonId, taskId, passed) {
    return storage.setProgress(userId, lessonId, {
      tasks: { [taskId]: { passed, at: Date.now() } },
      status: 'in-progress',
    });
  },

  async setQuizResult(userId, lessonId, quizId, correct) {
    return storage.setProgress(userId, lessonId, {
      quiz: { [quizId]: { correct, at: Date.now() } },
      status: 'in-progress',
    });
  },

  async getLesson(userId, lessonId) {
    return storage.getProgress(userId, lessonId);
  },

  async getAll(userId) {
    return storage.getAllProgress(userId);
  },

  async courseStats(userId, courseId, lessonIds) {
    const all = await this.getAll(userId);
    const map = new Map(all.map(p => [p.lessonId, p]));
    let completed = 0, inProgress = 0;
    for (const lid of lessonIds) {
      const p = map.get(lid);
      if (!p) continue;
      if (p.status === 'completed') completed++;
      else if (p.status === 'in-progress') inProgress++;
    }
    const total = lessonIds.length;
    return {
      total, completed, inProgress,
      percent: total ? Math.round((completed / total) * 100) : 0,
    };
  },
};
