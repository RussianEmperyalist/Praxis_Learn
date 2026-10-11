const fs = require('fs');
const path = process.argv[2];
if (!path) { console.log('Usage: node check.cjs <lesson.json> [prereq]'); process.exit(1); }

const expectedPrereq = process.argv[3];
let errors = [];
let warnings = [];

try {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  console.log('JSON valid: true');
  
  const sentences = data.goal.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 1) warnings.push('goal: more than one sentence');
  if (expectedPrereq && !data.prereq.includes(expectedPrereq)) {
    errors.push('prereq: wrong');
  }
  if (data.duration < 10 || data.duration > 20) warnings.push('duration');

  const theory = data.theory;
  if (theory.length < 15) errors.push('theory: ' + theory.length + ' (min 15)');
  const predictCount = theory.filter(b => b.type === 'predict').length;
  if (predictCount < 2) errors.push('predict: ' + predictCount);
  const warningCount = theory.filter(b => b.type === 'warning').length;
  if (warningCount < 1) errors.push('warning: ' + warningCount);
  const noteTipCount = theory.filter(b => b.type === 'note' || b.type === 'tip').length;
  if (noteTipCount < 1) errors.push('note/tip: ' + noteTipCount);
  const codeCount = theory.filter(b => b.type === 'code').length;
  if (codeCount < 2) errors.push('code: ' + codeCount);

  const tasks = data.tasks;
  if (tasks.length !== 5) errors.push('tasks: ' + tasks.length);
  const expectedOrder = ['guided', 'from-scratch', 'guided', 'debug', 'from-scratch'];
  for (let i = 0; i < Math.min(tasks.length, 5); i++) {
    if (tasks[i].type !== expectedOrder[i]) errors.push('tasks[' + i + ']: ' + tasks[i].type);
  }
  tasks.forEach((t, i) => {
    if ((t.hints || []).length < 2) errors.push('tasks[' + i + ']: hints');
    if ((t.checks || []).length < 3 || (t.checks || []).length > 5) {
      errors.push('tasks[' + i + ']: ' + (t.checks || []).length + ' checks');
    }
    const last = (t.checks || [])[(t.checks || []).length - 1];
    if (!last || last.kind !== 'no-error') errors.push('tasks[' + i + ']: last check');
  });

  if (data.recap.length < 3 || data.recap.length > 6) errors.push('recap: ' + data.recap.length);
  const quiz = data.quiz;
  if (quiz.length < 3 || quiz.length > 5) errors.push('quiz: ' + quiz.length);
  quiz.forEach((q, i) => {
    if (!q.explain) errors.push('quiz[' + i + ']: no explain');
    if (q.answer < 0 || q.answer >= q.options.length) errors.push('quiz[' + i + ']: answer');
  });

  console.log('theory: ' + theory.length + ', predict: ' + predictCount + ', tasks: ' + tasks.length);
  console.log('recap: ' + data.recap.length + ', quiz: ' + quiz.length);

  if (errors.length > 0) {
    console.log('\nERRORS:');
    errors.forEach(e => console.log('  X ' + e));
  }
  if (warnings.length > 0) {
    console.log('\nWARNINGS:');
    warnings.forEach(w => console.log('  ! ' + w));
  }
  if (errors.length === 0 && warnings.length === 0) console.log('\nALL PASS');
  if (errors.length === 0 && warnings.length > 0) console.log('\nOK (warnings only)');
  if (errors.length > 0) console.log('\nFAILED');
} catch(e) {
  console.log('JSON valid: false');
  console.log('Error:', e.message);
}
