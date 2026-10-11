const fs = require('fs');
const path = require('path');
const LESSONS_DIR = path.join(__dirname, 'content/python');

const PREREQ_CHAIN = [
  null,                            // 01
  'python-01-intro',               // 02
  'python-02-variables',           // 03
  'python-03-numbers',             // 04
  'python-04-strings',             // 05
  'python-05-input',               // 06
  'python-06-if-else',             // 07
  'python-07-while-loops',         // 08
  'python-08-functions',           // 09
  'python-09-lists',               // 10
  'python-10-tuples-dicts',        // 11
  'python-11-list-comprehensions', // 12
  'python-12-string-format',       // 13
  'python-13-error-handling',      // 14
  'python-14-modules',             // 15
  'python-15-file-io',             // 16
  'python-16-oop-basics',          // 17
  'python-17-oop-inheritance',     // 18
  'python-18-lambda',              // 19
  'python-19-iterators-generators',// 20
  'python-20-decorators',          // 21
  'python-21-context-managers',    // 22
  'python-22-json',                // 23
  'python-23-regex',               // 24
  'python-24-datetime',            // 25
  'python-25-collections',         // 26
  'python-26-pathlib',             // 27
  'python-27-http',                // 28
  'python-28-sqlite',              // 29
  'python-29-threading',           // 30
];

function checkLesson(filePath, idx) {
  const issues = { errors: [], warnings: [], info: [] };
  const basename = path.basename(filePath);
  let title = basename;

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    title = data.title || basename;
  } catch(e) {
    return { errors: ['Invalid JSON: ' + e.message], warnings: [], info: [], title: basename };
  }

  // --- Structure ---
  const requiredFields = ['id', 'title', 'goal', 'prereq', 'duration', 'theory', 'tasks', 'recap', 'quiz'];
  for (const f of requiredFields) {
    if (!(f in data)) issues.errors.push('Missing field: ' + f);
  }

  // id matches filename
  const fileId = 'python-' + basename.replace('.json', '');
  if (data.id !== fileId) {
    issues.errors.push('id mismatch: file=' + fileId + ', id=' + data.id);
  }

  // prereq checks
  if (idx > 0 && PREREQ_CHAIN[idx]) {
    if (!data.prereq || !Array.isArray(data.prereq) || data.prereq.length === 0) {
      issues.warnings.push('Missing prereq (should be ' + PREREQ_CHAIN[idx] + ')');
    } else if (!data.prereq.includes(PREREQ_CHAIN[idx])) {
      issues.warnings.push('prereq should be ' + PREREQ_CHAIN[idx] + ', got ' + JSON.stringify(data.prereq));
    }
  }

  // duration range
  if (data.duration < 10 || data.duration > 20) {
    issues.warnings.push('duration=' + data.duration + ' (expected 10-20)');
  }

  // --- Theory ---
  if (!Array.isArray(data.theory)) {
    issues.errors.push('theory is not array');
    return { ...issues, title };
  }

  if (data.theory.length < 15) {
    issues.warnings.push('theory: ' + data.theory.length + ' blocks (min 15)');
  }

  // hook
  const hook = data.theory.find(b => b.type === 'hook');
  if (!hook) {
    issues.errors.push('No hook block');
  }

  // predict
  const predicts = data.theory.filter(b => b.type === 'predict');
  if (predicts.length < 2) {
    issues.warnings.push('predict: ' + predicts.length + ' (min 2)');
  }
  predicts.forEach((p, i) => {
    if (!p.code) issues.errors.push('predict[' + i + ']: no code');
    if (!p.question) issues.errors.push('predict[' + i + ']: no question');
    if (!Array.isArray(p.options) || p.options.length !== 4) issues.errors.push('predict[' + i + ']: options != 4');
    if (p.answer === undefined) issues.errors.push('predict[' + i + ']: no answer');
    if (!p.explain) issues.errors.push('predict[' + i + ']: no explain');
  });

  // code blocks
  const codeBlocks = data.theory.filter(b => b.type === 'code');
  if (codeBlocks.length < 2) {
    issues.warnings.push('code blocks: ' + codeBlocks.length + ' (min 2)');
  }

  // warnings (PROMPT Part 3 says min 2)
  const warnings = data.theory.filter(b => b.type === 'warning');
  if (warnings.length < 1) {
    issues.warnings.push('warning: 0 (min 1 in checklist, 2 in PROMPT)');
  }
  if (warnings.length < 2) {
    issues.info.push('warning: ' + warnings.length + ' (PROMPT Part 3 says min 2)');
  }

  // tip/note
  const tips = data.theory.filter(b => b.type === 'tip' || b.type === 'note');
  if (tips.length < 1) {
    issues.warnings.push('tip/note: 0 (min 1)');
  }

  // --- Tasks ---
  if (!Array.isArray(data.tasks)) {
    issues.errors.push('tasks is not array');
    return { ...issues, title };
  }
  if (data.tasks.length !== 5) {
    issues.errors.push('tasks: ' + data.tasks.length + ' (must be 5)');
  }
  const expectedOrder = ['guided', 'from-scratch', 'guided', 'debug', 'from-scratch'];
  data.tasks.forEach((t, i) => {
    if (!t.id) issues.warnings.push('task[' + i + ']: no id');
    if (t.type !== expectedOrder[i]) {
      issues.errors.push('task[' + i + ']: type=' + t.type + ' (expected ' + expectedOrder[i] + ')');
    }
    if (!t.prompt) issues.warnings.push('task[' + i + ']: no prompt');
    if (!t.starter && t.type !== 'debug') issues.warnings.push('task[' + i + ']: no starter');
    if (!Array.isArray(t.hints) || t.hints.length < 2) {
      issues.errors.push('task[' + i + ']: hints=' + (t.hints || []).length + ' (min 2)');
    }
    if (!Array.isArray(t.checks)) {
      issues.errors.push('task[' + i + ']: no checks');
    } else {
      if (t.checks.length < 3 || t.checks.length > 5) {
        issues.warnings.push('task[' + i + ']: checks=' + t.checks.length + ' (3-5)');
      }
      const lastCheck = t.checks[t.checks.length - 1];
      if (!lastCheck || lastCheck.kind !== 'no-error') {
        issues.errors.push('task[' + i + ']: last check not no-error');
      }
    }

    // Check for solution leak in starter (skip debug tasks — broken code expected)
    if (t.starter && t.type !== 'debug') {
      const starterLines = t.starter.split('\n').filter(l => !l.trim().startsWith('#'));
      for (const sl of starterLines) {
        const trimmed = sl.trim();
        if (trimmed.startsWith('print(') && !trimmed.includes('#')) {
          issues.warnings.push('task[' + i + ']: starter has print() — possible solution leak');
        }
      }
    }

    // Check checks logic
    if (t.checks) {
      const checkKinds = t.checks.map(c => c.kind);
      if (t.type === 'from-scratch' && !checkKinds.includes('var') && !checkKinds.includes('stdout') && !checkKinds.includes('regex-stdout')) {
        issues.warnings.push('task[' + i + ']: from-scratch without var/stdout check');
      }
    }
  });

  // --- Recap ---
  if (!Array.isArray(data.recap)) {
    issues.errors.push('recap is not array');
  } else {
    if (data.recap.length < 3 || data.recap.length > 6) {
      issues.warnings.push('recap: ' + data.recap.length + ' (3-6)');
    }
  }

  // --- Quiz ---
  if (!Array.isArray(data.quiz)) {
    issues.errors.push('quiz is not array');
  } else {
    if (data.quiz.length < 3 || data.quiz.length > 5) {
      issues.warnings.push('quiz: ' + data.quiz.length + ' (3-5)');
    }
    data.quiz.forEach((q, i) => {
      if (!q.explain) issues.errors.push('quiz[' + i + ']: no explain');
      if (q.answer === undefined || q.answer < 0 || q.answer >= (q.options || []).length) {
        issues.errors.push('quiz[' + i + ']: answer out of range');
      }
    });
  }

  return { ...issues, title };
}

// Main — filter out orphaned 03-lists.json
const files = fs.readdirSync(LESSONS_DIR)
  .filter(f => /^\d\d-/.test(f) && f !== '03-lists.json')
  .sort();

const results = [];
for (let i = 0; i < files.length; i++) {
  const fullPath = path.join(LESSONS_DIR, files[i]);
  const issues = checkLesson(fullPath, i);
  results.push({ file: files[i], ...issues });
}

// Print results
let clean = 0, warnOnly = 0, failed = 0;
console.log('=== АУДИТ PYTHON ===\n');
console.log('Всего уроков: ' + files.length);
results.forEach(r => {
  if (r.errors.length === 0 && r.warnings.length === 0) clean++;
  else if (r.errors.length === 0) warnOnly++;
  else failed++;
});
console.log('Соответствуют PROMPT.md: ' + clean);
console.log('С замечаниями: ' + warnOnly);
console.log('Критичные проблемы: ' + failed);
console.log('\n--- ПО УРОКАМ ---\n');

results.forEach(r => {
  const num = r.file.replace(/(-.*)?\.json$/, '');
  const allIssues = [...r.errors, ...r.warnings];

  if (r.errors.length === 0 && r.warnings.length === 0) {
    console.log('[OK] ' + r.file + ' — ' + r.title);
  } else if (r.errors.length === 0) {
    console.log('[WARN] ' + r.file + ' — ' + r.title);
    allIssues.forEach(i => console.log('     • ' + i));
  } else {
    console.log('[FAIL] ' + r.file + ' — ' + r.title);
    r.errors.forEach(i => console.log('     X ' + i));
    r.warnings.forEach(i => console.log('     • ' + i));
  }
  if (r.info && r.info.length > 0) {
    r.info.forEach(i => console.log('     · ' + i + ' (info)'));
  }
  console.log('');
});

// Summary
console.log('\n--- СВОДКА ПО ПРОБЛЕМАМ ---\n');

const byCategory = {
  theory: results.filter(r => r.errors.some(e => e.includes('No hook') || e.includes('theory') || e.includes('predict')) || r.warnings.some(w => w.includes('theory') || w.includes('predict') || w.includes('code blocks') || w.includes('warning'))).map(r => r.file),
  tasks: results.filter(r => r.errors.some(e => e.includes('task') && (e.includes('type=') || e.includes('hints') || e.includes('no-error') || e.includes('must be 5')) || e.includes('No starter')) || r.warnings.some(w => w.includes('no starter'))).map(r => r.file),
  checks: results.filter(r => r.warnings.some(w => w.includes('checks=')) || r.errors.some(e => e.includes('checks'))).map(r => r.file),
  recapQuiz: results.filter(r => r.warnings.some(w => w.includes('recap') || w.includes('quiz'))).map(r => r.file),
  starter: results.filter(r => r.warnings.some(w => w.includes('starter has print'))).map(r => r.file),
  structure: results.filter(r => r.errors.some(e => e.includes('Missing field') || e.includes('id mismatch'))).map(r => r.file),
  prereq: results.filter(r => r.warnings.some(w => w.includes('prereq'))).map(r => r.file),
  fromScratch: results.filter(r => r.warnings.some(w => w.includes('from-scratch without'))).map(r => r.file),
};

console.log('theory (hook/theory-block count/predict/warning/code/tip): ' + (byCategory.theory.length > 0 ? byCategory.theory.join(', ') : 'нет'));
console.log('tasks (count/type order/hints/starter): ' + (byCategory.tasks.length > 0 ? byCategory.tasks.join(', ') : 'нет'));
console.log('checks (3-5 per task): ' + (byCategory.checks.length > 0 ? byCategory.checks.join(', ') : 'нет'));
console.log('recap/quiz: ' + (byCategory.recapQuiz.length > 0 ? byCategory.recapQuiz.join(', ') : 'нет'));
console.log('starter с решением: ' + (byCategory.starter.length > 0 ? byCategory.starter.join(', ') : 'нет'));
console.log('структурные (missing fields/id mismatch): ' + (byCategory.structure.length > 0 ? byCategory.structure.join(', ') : 'нет'));
console.log('from-scratch без var/stdout: ' + (byCategory.fromScratch.length > 0 ? byCategory.fromScratch.join(', ') : 'нет'));

console.log('\nlessons with <2 warnings (PROMPT Part 3 says min 2):');
results.forEach(r => {
  if (r.info && r.info.length > 0) {
    console.log('  ' + r.file + ' — ' + r.info.join('; '));
  }
});

// Check index.json
console.log('\n--- ПРОВЕРКА index.json ---');
const idxPath = path.join(LESSONS_DIR, 'index.json');
try {
  const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
  const count = idx.lessons ? idx.lessons.length : 0;
  console.log('Записей в index.json: ' + count);

  // index IDs don't have 'python-' prefix — strip it from file IDs for comparison
  const fileIds = new Set(files.map(f => f.replace('.json', '')));
  const indexIds = new Set(idx.lessons.map(l => l.id));
  const missing = [...fileIds].filter(id => !indexIds.has(id));
  const extra = [...indexIds].filter(id => !fileIds.has(id));
  if (missing.length > 0) console.log('В файловой системе есть, но нет в index: ' + missing.join(', '));
  if (extra.length > 0) console.log('В index есть, но файлов нет: ' + extra.join(', '));

  // Check order
  let orderOk = true;
  idx.lessons.forEach((l, i) => {
    const expectedNum = String(i + 1).padStart(2, '0');
    if (!l.id.startsWith(expectedNum)) {
      console.log('Порядок нарушен на позиции ' + i + ': ' + l.id + ' (ожидалось ' + expectedNum + '-*)');
      orderOk = false;
    }
  });
  if (orderOk) console.log('Порядок записей: OK');
  if (missing.length === 0 && extra.length === 0 && orderOk && count === 30) console.log('index.json: OK');
} catch(e) {
  console.log('index.json: ERROR - ' + e.message);
}

// Check service-worker.js
console.log('\n--- ПРОВЕРКА service-worker.js ---');
const swPath = path.join(__dirname, 'service-worker.js');
try {
  const sw = fs.readFileSync(swPath, 'utf8');
  const cacheVer = sw.match(/CACHE_VERSION\s*=\s*(\d+)/);
  console.log('CACHE_VERSION: ' + (cacheVer ? cacheVer[1] : 'not found'));

  const precacheUrls = [];
  sw.split('\n').forEach(line => {
    const match = line.match(/'(\.\/content\/python\/\d\d-.*?\.json)'/);
    if (match) precacheUrls.push(match[1]);
  });

  console.log('Пути в PRECACHE_URLS: ' + precacheUrls.length);

  const missingFiles = [];
  files.forEach(f => {
    const url = './content/python/' + f;
    if (!precacheUrls.includes(url)) missingFiles.push(f);
  });

  if (missingFiles.length > 0) {
    console.log('Отсутствуют в PRECACHE_URLS: ' + missingFiles.join(', '));
  } else {
    console.log('Все ' + files.length + ' файлов присутствуют: OK');
  }
} catch(e) {
  console.log('service-worker.js: ' + e.message);
}

// Orphaned file
console.log('\n--- ОБРАТИТЕ ВНИМАНИЕ ---');
try {
  if (fs.existsSync(path.join(LESSONS_DIR, '03-lists.json'))) {
    console.log('03-lists.json — ORPHANED (дубль номера с 03-numbers.json, не в index.json)');
  }
} catch(e) {}
