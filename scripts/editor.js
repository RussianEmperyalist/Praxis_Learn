/**
 * Amber Learn — JS Playground (editor + runner).
 * Создаёт textarea с подсветкой стартового кода, кнопку «Проверить»
 * и область вывода. Запускает код через sandbox iframe.
 */

import { runJS } from './js-runner.js';
import { toast } from './app.js';

const CHECKS_SCHEMA = [
  'stdout',
  'stdout-match',
  'var',
  'has-call',
  'no-error',
  'has-template-literal',
];

/**
 * Создаёт playground-блок и вставляет его в mountElement.
 * @param {HTMLElement} mountElement
 * @param {Object} opts
 * @param {string} opts.starter — стартовый код
 * @param {Array} opts.checks — массив проверок
 * @param {string} [opts.userId]
 * @param {string} [opts.taskId]
 * @param {string} [opts.currentLessonId]
 * @param {Function} [opts.onPass]
 */
export async function createPlayground(mountElement, opts) {
  const { starter = '', checks = [], onPass } = opts;

  mountElement.innerHTML = `
    <div class="playground">
      <textarea class="playground-textarea" id="code-editor" spellcheck="false">${escapeHtml(starter)}</textarea>
      <div class="playground-actions">
        <button class="btn btn-primary" id="runBtn">Проверить</button>
        <button class="btn btn-ghost" id="clearBtn">Очистить</button>
        <span class="status" id="runStatus"></span>
      </div>
      <pre class="playground-output" id="output" style="display:none; background:var(--code-bg); border:1px solid var(--border); border-radius:4px; padding:12px; margin-top:8px; font-family:var(--font-mono); font-size:0.85rem; color:var(--code-text); white-space:pre-wrap; max-height:300px; overflow-y:auto;"></pre>
    </div>
  `;

  const editor = mountElement.querySelector('#code-editor');
  const runBtn = mountElement.querySelector('#runBtn');
  const clearBtn = mountElement.querySelector('#clearBtn');
  const status = mountElement.querySelector('#runStatus');
  const output = mountElement.querySelector('#output');

  // Tab support
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 4;
    }
  });

  clearBtn.addEventListener('click', () => {
    editor.value = '';
    output.style.display = 'none';
    output.textContent = '';
    status.textContent = '';
  });

  runBtn.addEventListener('click', async () => {
    const code = editor.value;
    runBtn.disabled = true;
    runBtn.textContent = 'Запуск...';
    status.textContent = '';

    try {
      const result = await runJS(code);

      if (result.stderr) {
        output.style.display = 'block';
        output.innerHTML = `<span style="color:var(--red);">Ошибка: ${escapeHtml(result.stderr)}</span>`;
      } else {
        output.style.display = 'block';
        const stdout = result.stdout.trim() ? escapeHtml(result.stdout.trim()) : '(нет вывода)';
        output.innerHTML = `<span style="color:var(--green);">Вывод:</span>\n${stdout}`;
      }

      // Проверяем checks
      const allPassed = evaluateChecks(code, result, checks);
      if (allPassed) {
        status.innerHTML = '<span style="color:var(--green);">✓ Все проверки пройдены!</span>';
        toast('Задача решена ✓', 'success');
        if (onPass) onPass();
      } else {
        status.innerHTML = '<span style="color:var(--yellow);">✗ Не все проверки пройдены</span>';
      }
    } catch (e) {
      output.style.display = 'block';
      output.innerHTML = `<span style="color:var(--red);">Ошибка выполнения: ${escapeHtml(e.message)}</span>`;
      status.textContent = '✗ Ошибка';
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = 'Проверить';
    }
  });
}

/**
 * Проверяет код и результат по списку checks.
 */
function evaluateChecks(code, result, checks) {
  if (!checks.length) return true;

  for (const check of checks) {
    const kind = check.kind || 'stdout';

    switch (kind) {
      case 'stdout': {
        if (!result.stdout.includes(String(check.equals || check.value || ''))) return false;
        break;
      }
      case 'stdout-match': {
        const regex = new RegExp(check.equals || check.value || '');
        if (!regex.test(result.stdout)) return false;
        break;
      }
      case 'var': {
        const varName = check.name;
        const expected = check.equals || check.value;
        const actual = result.vars[varName];
        if (actual === undefined || String(actual) !== String(expected)) return false;
        break;
      }
      case 'has-call': {
        const fnName = check.name || check.equals || check.value;
        const callRegex = new RegExp(`${fnName}\s*\(`);
        if (!callRegex.test(code)) return false;
        break;
      }
      case 'no-error': {
        if (result.stderr) return false;
        break;
      }
      case 'has-template-literal': {
        const regex = /`.*\$\{.*\}.*`/;
        if (!regex.test(code)) return false;
        break;
      }
      default:
        // Unknown check — pass by default
        break;
    }
  }

  return true;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
