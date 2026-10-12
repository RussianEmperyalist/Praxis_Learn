import { runPython } from './pyodide-runner.js';
import { storage } from './storage.js';

/**
 * Создаёт playground (редактор + вывод) внутри контейнера.
 * @param {HTMLElement} mount
 * @param {object} opts { starter, userId, taskId, checks, onPass, currentLessonId }
 */
export async function createPlayground(mount, opts) {
  mount.innerHTML = `
    <div class="playground">
      <div class="playground-header">
        <span>Песочница · Python</span>
      </div>
      <div class="playground-body">
        <div id="editor-mount"></div>
        <div class="playground-output placeholder">Вывод появится здесь</div>
      </div>
      <div class="playground-actions">
        <button class="btn btn-primary btn-sm" data-act="check" aria-label="Проверить">✓ Проверить</button>
        <button class="btn btn-ghost btn-sm" data-act="run" aria-label="Запустить">▶ Запустить</button>
        <button class="btn btn-ghost btn-sm" data-act="reset" aria-label="Сбросить">↺ Сбросить</button>
        <span class="status" id="status">Готов к запуску</span>
      </div>
    </div>
  `;

  const editorMount = mount.querySelector('#editor-mount');
  const out = mount.querySelector('.playground-output');
  const status = mount.querySelector('#status');
  const checkBtn = mount.querySelector('[data-act="check"]');
  const runBtn = mount.querySelector('[data-act="run"]');
  const resetBtn = mount.querySelector('[data-act="reset"]');

  const firstLine = opts.starter ?? '';
  let codeGetValue = () => firstLine;
  let editor = null;
  let saveT = null;

  try {
    const { EditorView, keymap, EditorView: EV } = await import('https://esm.sh/@codemirror/view@6');
    const { EditorState } = await import('https://esm.sh/@codemirror/state@6');
    const { python } = await import('https://esm.sh/@codemirror/lang-python@6');
    const { indentWithTab } = await import('https://esm.sh/@codemirror/commands@6');

    editor = new EditorView({
      state: EditorState.create({
        doc: firstLine || '# напишите ваш код здесь',
        extensions: [
          EditorState.tabIndent,
          indentWithTab,
          python(),
          EditorView.lineWrapping,
          keymap.of([
            { key: 'Mod-Enter', run: () => { executeAndRun(); return true; } },
          ]),
          EditorView.updateListener.of((v) => {
            if (v.docChanged && opts.userId && opts.taskId) {
              clearTimeout(saveT);
              saveT = setTimeout(() => {
                storage.saveDraft(opts.userId, opts.taskId, v.state.doc.toString());
              }, 400);
            }
          }),
          EditorView.theme({
            '&': {
              backgroundColor: 'var(--code-bg)',
              color: 'var(--code-text)',
              fontSize: '0.92rem',
              lineHeight: '1.55',
            },
            '&.cm-focused': { outline: 'none' },
            '.cm-gutter': {
              backgroundColor: 'var(--surface)',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              padding: '0 6px',
            },
            '.cm-activeLine': { backgroundColor: 'rgba(0, 240, 255, 0.04)' },
            '.cm-activeLineGutter': { backgroundColor: 'var(--surface-2)' },
            '.cm-cursor': { borderLeft: '2px solid var(--accent)' },
            '.cm-scroller': { fontFamily: 'var(--font-mono)' },
            '.cm-line': { lineHeight: '1.55' },
            '&.cm-focused .cm-scroller': { outline: 'none' },
          }, { dark: true }),
        ],
      }),
      parent: editorMount,
    });

    codeGetValue = () => editor.state.doc.toString();
  } catch (e) {
    console.warn('CodeMirror 6 failed to load, falling back to textarea:', e);

    editorMount.innerHTML = '<textarea spellcheck="false" autocapitalize="off"></textarea>';
    const ta = editorMount.querySelector('textarea');
    ta.value = firstLine || '# напишите ваш код здесь';
    codeGetValue = () => ta.value;

    ta.addEventListener('input', () => {
      clearTimeout(saveT);
      saveT = setTimeout(() => {
        if (opts.userId && opts.taskId) {
          storage.saveDraft(opts.userId, opts.taskId, ta.value);
        }
      }, 400);
    });

    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart, end = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(end);
        ta.selectionStart = ta.selectionEnd = s + 4;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeAndRun();
      }
    });
  }

  // Load draft
  if (opts.userId && opts.taskId) {
    storage.getDraft(opts.userId, opts.taskId).then(code => {
      if (!code || !editor) return;
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: code } });
    }).catch(() => {});
  }

  function setStatus(text, cls = '') {
    status.textContent = text;
    status.className = 'status';
    if (cls) status.classList.add(cls);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async function execute() {
    const code = codeGetValue();
    runBtn.disabled = true;
    checkBtn.disabled = true;
    setStatus('Исполняется...', 'warning');
    out.classList.remove('placeholder');

    try {
      const { stdout, stderr, var_info } = await runPython(code);
      let html = '';
      if (stdout) html += `<span class="ok">${escapeHtml(stdout)}</span>`;
      if (stderr) html += (html ? '\n' : '') + `<span class="err">${escapeHtml(stderr)}</span>`;
      out.innerHTML = html || '';
      return { stdout, stderr, var_info };
    } catch (err) {
      out.innerHTML = `<span class="err">${escapeHtml(err.message)}</span>`;
      return null;
    } finally {
      runBtn.disabled = false;
      checkBtn.disabled = false;
    }
  }

  function executeAndRun() {
    return execute().then(() => {
      setStatus('Готово', '');
    });
  }

  function normalizeChecks() {
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

    return checks.map(check => {
      switch (check.kind) {
        case 'no-error':
          return { pass: !hasError, expected: 'без ошибок', actual: hasError ? 'ошибка' : 'ок' };
        case 'stdout':
          if (check.equals == null) return { pass: true, expected: 'stdout', actual: 'ок' };
          const pass = normStdout === String(check.equals).replace(/\s+$/, '');
          return { pass, expected: '"' + check.equals + '"', actual: normStdout };
        case 'regex-stdout':
          if (!check.pattern) return { pass: true, expected: 'regex', actual: 'ок' };
          const rpass = new RegExp(check.pattern, 'm').test(stdout || '');
          return { pass: rpass, expected: 'паттерн ' + check.pattern, actual: normStdout };
        case 'var':
          const v = varInfo[check.name];
          if (!v) return { pass: false, expected: 'переменная ' + check.name, actual: 'не найдена' };
          if (check.type && v.type !== check.type) return { pass: false, expected: 'тип ' + check.type, actual: v.type };
          if (check.equals != null) {
            const vpass = v.repr === String(check.equals);
            return { pass: vpass, expected: '"' + check.equals + '"', actual: v.repr };
          }
          return { pass: true, expected: 'переменная ' + check.name, actual: 'ок' };
        case 'var-exists':
          return { pass: !!varInfo[check.name], expected: 'существует ' + check.name, actual: varInfo[check.name] ? 'да' : 'нет' };
        case 'has-call':
          if (!check.name) return { pass: true, expected: 'has-call', actual: 'ок' };
          const cp = new RegExp('\\b' + check.name + '\\s*\\(').test(code);
          return { pass: cp, expected: 'вызов ' + check.name + '()', actual: cp ? 'да' : 'нет' };
        case 'has-fstring':
          const fp = /f["']/.test(code);
          return { pass: fp, expected: 'f-строка', actual: fp ? 'да' : 'нет' };
        case 'has-keyword':
          if (!check.keyword) return { pass: true, expected: 'has-keyword', actual: 'ок' };
          const kp = new RegExp('\\b' + check.keyword + '\\b').test(code);
          return { pass: kp, expected: 'ключевое слово ' + check.keyword, actual: kp ? 'да' : 'нет' };
        default:
          return { pass: true, expected: 'неизвестно', actual: 'ок' };
      }
    });
  }

  checkBtn.addEventListener('click', async () => {
    const result = await execute();
    if (!result) {
      setStatus('✗ Ошибка выполнения', 'err');
      return;
    }

    const { stdout, stderr, var_info } = result;
    const checks = normalizeChecks();

    if (checks.length === 0) {
      setStatus('Готово', '');
      return;
    }

    const results = evaluateChecks(checks, codeGetValue(), stdout, stderr, var_info);
    const allPass = results.every(r => r.pass);

    if (allPass) {
      setStatus('✓ Верно', 'ok');
      if (opts.userId && opts.taskId) {
        storage.setProgress(opts.userId, opts.currentLessonId, {
          tasks: { [opts.taskId]: { passed: true, at: Date.now() } }
        }).then(() => opts.onPass?.());
      }
    } else {
      const failed = results.filter(r => !r.pass);
      const first = failed[0];
      const detail = 'Ожидалось: ' + first.expected + ', получено: ' + (first.actual || '—');
      setStatus('✗ ' + detail, 'err');
    }
  });

  runBtn.addEventListener('click', async () => {
    const result = await execute();
    if (result) setStatus('Готово', '');
  });

  resetBtn.addEventListener('click', () => {
    if (editor) {
      editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: firstLine || '# напишите ваш код здесь' } });
    }
    out.innerHTML = '';
    out.classList.add('placeholder');
    out.textContent = 'Вывод появится здесь';
    setStatus('Готов к запуску');
  });

  return { run: execute };
}
