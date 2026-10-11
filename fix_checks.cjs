const fs = require('fs');
const path = require('path');

const fixes = {
  '05-input.json': {
    t2: { kind: 'regex-stdout', pattern: 'Квадрат: \\d+' },
    t5: { kind: 'regex-stdout', pattern: 'Имя: .+, через 10 лет будет \\d+' },
  },
  '06-if-else.json': {
    t2: { kind: 'regex-stdout', pattern: '(Продвинутый|Новичок)' },
    t5: { kind: 'regex-stdout', pattern: 'Оценка: [A-F]' },
  },
  '07-while-loops.json': {
    t2: { kind: 'regex-stdout', pattern: 'Сумма: \\d+' },
  },
  '08-functions.json': {
    t5: { kind: 'regex-stdout', pattern: 'Пароль: (True|False)' },
  },
  '09-lists.json': {
    t5: { kind: 'regex-stdout', pattern: 'Товары: .+' },
  },
  '13-error-handling.json': {
    t2: { kind: 'stdout', equals: 'Результат: 5.0' },
    t5: { kind: 'regex-stdout', pattern: '(Получено: \\d+|Введите число!)' },
  },
  '14-modules.json': {
    t2: { kind: 'regex-stdout', pattern: 'Случайные: \\[' },
    t5: { kind: 'stdout', equals: 'pi = 3.141592653589793' },
  },
  '15-file-io.json': {
    t2: { kind: 'regex-stdout', pattern: 'Содержимое: .+' },
    t5: { kind: 'stdout', equals: 'Строки: 2' },
  },
  '16-oop-basics.json': {
    t5: { kind: 'stdout', equals: 'Активен: True, осталось: 20' },
  },
  '18-lambda.json': {
    t2: { kind: 'stdout', equals: 'Умножено: [3, 6, 9, 12, 15]' },
    t5: { kind: 'stdout', equals: 'Отсортировано: [9, 5, 3, 1]' },
  },
  '21-context-managers.json': {
    t2: { kind: 'stdout', equals: 'start\nработа\nend\nГотово' },
    t5: { kind: 'stdout', equals: 'Счётчик: 0' },
  },
  '22-json.json': {
    t5: { kind: 'stdout', equals: 'Config: {\n  "host": "localhost",\n  "port": 5432\n}' },
  },
  '23-regex.json': {
    t2: { kind: 'stdout', equals: 'Email: admin@corp.io' },
  },
  '24-datetime.json': {
    t5: { kind: 'regex-stdout', pattern: 'Возраст: \\d+ дней' },
  },
  '25-collections.json': {
    t5: { kind: 'stdout', equals: "Счётчик: Counter({'cat': 3, 'dog': 1, 'bird': 1})" },
  },
  '26-pathlib.json': {
    t5: { kind: 'stdout', equals: 'Путь: structure/config.json' },
  },
  '27-http.json': {
    t2: { kind: 'regex-stdout', pattern: 'URL: .+' },
    t5: { kind: 'regex-stdout', pattern: 'Статус: \\d+' },
  },
  '28-sqlite.json': {
    t2: { kind: 'stdout', equals: 'Пользователь: V' },
  },
  '29-threading.json': {
    t2: { kind: 'regex-stdout', pattern: 'Все завершены' },
  },
};

const dir = 'content/python';
let changed = [];

for (const [file, tasks] of Object.entries(fixes)) {
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const [taskId, newCheck] of Object.entries(tasks)) {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) {
      console.log('NOT FOUND: ' + file + ' ' + taskId);
      continue;
    }

    // Check if task already has stdout/var/regex-stdout
    const hasCheck = task.checks.some(c => ['var', 'stdout', 'regex-stdout'].includes(c.kind));
    if (hasCheck) {
      console.log('SKIP (already has check): ' + file + ' ' + taskId);
      continue;
    }

    // Find the last no-error check and insert before it
    const lastErrorIdx = task.checks.map((c, i) => c.kind === 'no-error' ? i : -1).filter(i => i >= 0).pop();
    if (lastErrorIdx === undefined) {
      console.log('NO no-error: ' + file + ' ' + taskId);
      continue;
    }

    task.checks.splice(lastErrorIdx, 0, newCheck);
    changed.push(file + ' ' + taskId);
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

console.log('\nChanged ' + changed.length + ' tasks:');
changed.forEach(c => console.log('  + ' + c));
