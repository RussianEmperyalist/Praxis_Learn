import { GitSim } from './git-simulator.js';
import { renderGraph, clearGraph } from './git-render.js';

export function createGitTerminal(mountEl, initialState) {
  const sim = new GitSim();
  if (initialState) {
    sim.state = JSON.parse(JSON.stringify(initialState));
  }

  const container = document.createElement('div');
  container.className = 'git-terminal-container';
  container.innerHTML = `
    <div class="git-terminal">
      <div class="git-terminal-output" id="gitOutput"></div>
      <div class="git-terminal-graph" id="gitGraph"></div>
      <div class="git-terminal-input-line">
        <span class="git-prompt">$</span>
        <input type="text" id="gitInput" class="git-input" autocomplete="off" spellcheck="false" placeholder="Введите git-команду...">
      </div>
      <div class="git-terminal-footer">
        <button class="btn btn-primary btn-sm" id="gitCheckBtn">✓ Проверить</button>
        <button class="btn btn-ghost btn-sm" id="gitResetBtn">Сбросить</button>
        <span class="git-status" id="gitStatus"></span>
      </div>
    </div>
  `;

  mountEl.appendChild(container);

  const outputEl = container.querySelector('#gitOutput');
  const inputEl = container.querySelector('#gitInput');
  const graphEl = container.querySelector('#gitGraph');
  const checkBtn = container.querySelector('#gitCheckBtn');
  const resetBtn = container.querySelector('#gitResetBtn');
  const statusEl = container.querySelector('#gitStatus');

  let history = [];
  let historyIndex = -1;

  function appendOutput(text, isError = false) {
    const div = document.createElement('div');
    div.className = isError ? 'git-output-error' : 'git-output-line';
    div.textContent = text;
    outputEl.appendChild(div);
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function setStatus(text, err = false) {
    statusEl.textContent = text;
    statusEl.style.color = err ? 'var(--red)' : 'var(--accent)';
  }

  function runCommand(cmd) {
    history.push(cmd);
    historyIndex = -1;

    const result = sim.execute(cmd);
    if (result.error) {
      appendOutput(result.error, true);
    }
    result.output.forEach(line => appendOutput(line));
    renderGraph(sim.state, graphEl);
    return result;
  }

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = inputEl.value.trim();
      inputEl.value = '';
      if (cmd) {
        runCommand(cmd);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        if (historyIndex === -1) historyIndex = history.length - 1;
        else if (historyIndex > 0) historyIndex--;
        inputEl.value = history[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        historyIndex++;
        if (historyIndex >= history.length) {
          historyIndex = -1;
          inputEl.value = '';
        } else {
          inputEl.value = history[historyIndex];
        }
      }
    }
  });

  function evaluateGitChecks(checks) {
    const state = sim.state;
    return checks.map(check => {
      switch (check.kind) {
        case 'git-command-used': {
          const cmd = check.command || check.contains;
          return {
            pass: state.commandHistory.some(c => c.includes(cmd)),
            expected: 'команда ' + cmd,
            actual: state.commandHistory.some(c => c.includes(cmd)) ? 'выполнена' : 'не выполнена',
          };
        }
        case 'git-file-in-staged': {
          return {
            pass: check.file in state.staged,
            expected: 'файл ' + check.file + ' в индексе',
            actual: (check.file in state.staged) ? 'в индексе' : 'не в индексе',
          };
        }
        case 'git-commits-count':
          return {
            pass: state.commits.length === check.equals,
            expected: check.equals + ' коммитов',
            actual: state.commits.length + ' коммитов',
          };
        case 'git-branch-exists':
          return {
            pass: check.name in state.branches,
            expected: 'ветка ' + check.name,
            actual: (check.name in state.branches) ? 'существует' : 'не существует',
          };
        case 'git-branch-count':
          return {
            pass: Object.keys(state.branches).length === check.equals,
            expected: check.equals + ' веток',
            actual: Object.keys(state.branches).length + ' веток',
          };
        case 'git-head-branch':
          return {
            pass: state.head?.type === 'branch' && state.head.name === check.name,
            expected: 'HEAD → ' + check.name,
            actual: state.head?.type === 'branch' ? 'HEAD → ' + state.head.name : 'отсоединён',
          };
        case 'git-file-in-commit': {
          const lastCommit = state.commits[state.commits.length - 1];
          return {
            pass: lastCommit && check.file in lastCommit.files,
            expected: 'файл ' + check.file,
            actual: lastCommit && (check.file in lastCommit.files) ? 'присутствует' : 'отсутствует',
          };
        }
        case 'git-merge-happened': {
          const hasMerge = state.commits.some(c => c.parent2);
          return {
            pass: hasMerge,
            expected: 'есть merge-commit',
            actual: hasMerge ? 'да' : 'нет',
          };
        }
        case 'git-commit-message': {
          const lastCommit = state.commits[state.commits.length - 1];
          return {
            pass: lastCommit && lastCommit.message.includes(check.contains),
            expected: 'сообщение содержит "' + check.contains + '"',
            actual: lastCommit ? '"' + lastCommit.message + '"' : 'нет коммитов',
          };
        }
        case 'git-config-value':
          return {
            pass: (state.config || {})[check.key] === check.equals,
            expected: check.key + ' = ' + check.equals,
            actual: (state.config || {})[check.key] || 'не задан',
          };
        case 'git-repo-initialized':
          return {
            pass: state.initialized === true,
            expected: 'репозиторий инициализирован',
            actual: state.initialized ? 'да' : 'нет',
          };
        case 'git-no-error':
          return { pass: !state.lastError, expected: 'без ошибок', actual: state.lastError || 'ок' };
        default:
          return { pass: true, expected: 'неизвестно', actual: 'ок' };
      }
    });
  }

  checkBtn.addEventListener('click', () => {
    if (!opts || !opts.checks || opts.checks.length === 0) {
      setStatus('Нет проверок', false);
      return;
    }
    const results = evaluateGitChecks(opts.checks);
    const allPass = results.every(r => r.pass);
    if (allPass) {
      setStatus('✓ Верно', false);
      opts.onGitPass?.();
    } else {
      const failed = results.filter(r => !r.pass);
      const first = failed[0];
      setStatus('✗ ' + first.expected, true);
    }
  });

  let opts = null;
  function setOpts(o) { opts = o; }

  function doReset() {
    sim.state = {
      initialized: false,
      commits: [],
      branches: {},
      head: null,
      staged: {},
      working: {},
      remote: { origin: { url: null, branches: {} } },
      stash: [],
      config: {},
      output: [],
      commandHistory: [],
    };
    outputEl.innerHTML = '';
    clearGraph(graphEl);
    appendOutput('Репозиторий сброшен. Выполните git init.');
    setStatus('', false);
  }

    
  resetBtn.addEventListener('click', doReset);

  appendOutput('Добро пожаловать в Git симулятор');
  appendOutput('Введите "git help" для списка команд');

  return {
    execute: (cmd) => {
      return runCommand(cmd);
    },
    getState: () => JSON.parse(JSON.stringify(sim.state)),
    reset: doReset,
    setOpts,
    evaluateGitChecks,
    sim,
    runCommand,
    container,
  };
}
