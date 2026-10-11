import { runPython } from './pyodide-runner.js';
import { storage } from './storage.js';

/**
 * Создаёт playground (редактор + вывод) внутри контейнера.
 * @param {HTMLElement} mount
 * @param {object} opts { starter, userId, taskId, checks, onPass, currentLessonId }
 */
export function createPlayground(mount, opts) {
  mount.innerHTML = `
    <div class="playground">
      <div class="playground-header">
        <div class="dots"><span class="dot r"></span><span class="dot y"></span><span class="dot c"></span></div>
        <span>PYTHON · SANDBOX</span>
      </div>
      <div class="playground-body">
        <textarea spellcheck="false" autocapitalize="off"></textarea>
        <div class="playground-output">// Вывод появится здесь</div>
      </div>
      <div class="playground-actions">
        <button class="btn btn-primary" data-act="run">▶ Запустить</button>
        <button class="btn btn-ghost" data-act="reset">↺ Сбросить</button>
        <span class="status">Готов к запуску</span>
      </div>
    </div>
  `;

  const ta = mount.querySelector('textarea');
  const out = mount.querySelector('.playground-output');
  const status = mount.querySelector('.status');
  const runBtn = mount.querySelector('[data-act="run"]');
  const resetBtn = mount.querySelector('[data-act="reset"]');

  let firstLine = opts.starter ?? '';
  ta.value = firstLine;

  // Подгружаем черновик
  if (opts.userId && opts.taskId) {
    storage.getDraft(opts.userId, opts.taskId).then(code => {
      if (code) ta.value = code;
    }).catch(() => {});
  }

  // Автосохранение
  let saveT = null;
  ta.addEventListener('input', () => {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      if (opts.userId && opts.taskId) {
        storage.saveDraft(opts.userId, opts.taskId, ta.value);
      }
    }, 400);
  });

  // Tab = 4 пробела
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart, end = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = s + 4;
    }
  });

  function setStatus(text, cls = '') {
    status.textContent = text;
    status.style.color = cls;
  }

  function print(text, cls = '') {
    out.innerHTML = cls ? `<span class="${cls}">${escapeHtml(text)}</span>` : escapeHtml(text);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  async function run() {
    runBtn.disabled = true;
    setStatus('Исполняется...', 'var(--yellow)');
    print('', '');
    try {
      const { stdout, stderr, var_info } = await runPython(ta.value);
      let html = '';
      if (stdout) html += `<span class="ok">${escapeHtml(stdout)}</span>`;
      if (stderr) html += (html ? '\n' : '') + `<span class="err">${escapeHtml(stderr)}</span>`;
      out.innerHTML = html || '<span style="color:var(--text-mute)">// пусто</span>';

      const checks = normalizeChecks(opts);
      const passed = evaluateChecks(checks, ta.value, stdout, stderr, var_info);

      if (checks.length > 0) {
        if (passed) {
          setStatus('✓ Задача решена', 'var(--green)');
          if (opts.userId && opts.taskId) {
            storage.setProgress(opts.userId, opts.currentLessonId, {
              tasks: { [opts.taskId]: { passed: true, at: Date.now() } }
            }).then(() => opts.onPass?.());
          }
        } else {
          setStatus('✗ Проверки не пройдены', 'var(--red)');
        }
      } else {
        setStatus('Готово', 'var(--green)');
      }
    } catch (err) {
      setStatus('Ошибка', 'var(--red)');
      print(err.message, 'err');
    } finally {
      runBtn.disabled = false;
    }
  }

  function normalizeChecks(opts) {
    if (opts.checks && opts.checks.length) return opts.checks;
    if (opts.tests && opts.tests.length) {
      const converted = opts.tests.map(t => ({
        kind: t.expected_stdout != null ? 'stdout' : 'no-error',
        ...(t.expected_stdout != null ? { equals: t.expected_stdout } : {})
      }));
      if (!converted.some(c => c.kind === 'no-error')) {
        converted.push({ kind: 'no-error' });
      }
      return converted;
    }
    return [];
  }

  function evaluateChecks(checks, code, stdout, stderr, varInfo) {
    const normStdout = (stdout || '').replace(/\s+$/, '');
    const hasError = stderr && stderr.trim() !== '';

    return checks.every(check => {
      switch (check.kind) {
        case 'no-error':
          return !hasError;
        case 'stdout':
          if (check.equals == null) return true;
          return normStdout === String(check.equals).replace(/\s+$/, '');
        case 'regex-stdout':
          if (!check.pattern) return true;
          return new RegExp(check.pattern, 'm').test(stdout || '');
        case 'var':
          const v = varInfo[check.name];
          if (!v) return false;
          if (check.type && v.type !== check.type) return false;
          if (check.equals != null && v.repr !== String(check.equals)) return false;
          return true;
        case 'var-exists':
          return !!varInfo[check.name];
        case 'has-call':
          if (!check.name) return true;
          return new RegExp('\\b' + check.name + '\\s*\\(').test(code);
        case 'has-fstring':
          return /f["']/.test(code);
        case 'has-keyword':
          if (!check.keyword) return true;
          return new RegExp('\\b' + check.keyword + '\\b').test(code);
        default:
          return true;
      }
    });
  }

  runBtn.addEventListener('click', run);
  resetBtn.addEventListener('click', () => {
    ta.value = firstLine;
    out.textContent = '// Вывод появится здесь';
    setStatus('Готов к запуску');
  });

  // Ctrl+Enter — запуск
  ta.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      run();
    }
  });

  return { run };
}
