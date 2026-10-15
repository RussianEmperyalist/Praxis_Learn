import { DockerSim } from './docker-simulator.js';

export function createDockerTerminal(mountEl, initialState) {
  const sim = new DockerSim();
  if (initialState) {
    sim.state = JSON.parse(JSON.stringify(initialState));
  }

  const container = document.createElement('div');
  container.className = 'docker-terminal-container';
  container.innerHTML = `
    <div class="docker-terminal">
      <div class="docker-terminal-output" id="dockerOutput"></div>
      <div class="docker-terminal-input-line">
        <span class="docker-prompt">$</span>
        <input type="text" id="dockerInput" class="docker-input" autocomplete="off" spellcheck="false" placeholder="Введите docker-команду...">
      </div>
      <div class="docker-terminal-footer">
        <button class="btn btn-primary btn-sm" id="dockerCheckBtn">✓ Проверить</button>
        <button class="btn btn-ghost btn-sm" id="dockerResetBtn">Сбросить</button>
        <span class="docker-status" id="dockerStatus"></span>
      </div>
    </div>
    <div class="docker-status-panel" id="dockerStatusPanel"></div>
  `;

  mountEl.appendChild(container);

  const outputEl = container.querySelector('#dockerOutput');
  const inputEl = container.querySelector('#dockerInput');
  const statusPanelEl = container.querySelector('#dockerStatusPanel');
  const checkBtn = container.querySelector('#dockerCheckBtn');
  const resetBtn = container.querySelector('#dockerResetBtn');
  const statusEl = container.querySelector('#dockerStatus');
  const renderStatus = () => {
    const s = sim.state;
    let html = '<div class="docker-status-title">Состояние</div>';
    html += '<div class="docker-status-section"><b>Образы:</b> ' + s.images.length + '</div>';
    html += '<div class="docker-status-section"><b>Контейнеры:</b> ' + s.containers.length + ' (running: ' + s.containers.filter(c => c.status === 'running').length + ')</div>';
    if (s.containers.length > 0) {
      s.containers.forEach(c => {
        html += '<div class="docker-status-item">' + c.name + ' (' + c.id.slice(0, 12) + ') — ' + c.status + '</div>';
      });
    }
    statusPanelEl.innerHTML = html;
  };

  let history = [];
  let historyIndex = -1;

  function appendOutput(text, isError = false) {
    const div = document.createElement('div');
    div.className = isError ? 'docker-output-error' : 'docker-output-line';
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
    renderStatus();
    return result;
  }

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = inputEl.value.trim();
      inputEl.value = '';
      if (cmd) runCommand(cmd);
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

  function evaluateDockerChecks(checks) {
    const state = sim.state;
    return checks.map(check => {
      switch (check.kind) {
        case 'docker-command-used': {
          const cmd = check.command || check.contains;
          return {
            pass: state.commandHistory.some(c => c.includes(cmd)),
            expected: 'команда ' + cmd,
            actual: state.commandHistory.some(c => c.includes(cmd)) ? 'выполнена' : 'не выполнена',
          };
        }
        case 'docker-image-count':
          return {
            pass: state.images.length === check.equals,
            expected: check.equals + ' образов',
            actual: state.images.length + ' образов',
          };
        case 'docker-image-exists':
          return {
            pass: state.images.some(img => img.name === check.name),
            expected: 'образ ' + check.name,
            actual: state.images.some(img => img.name === check.name) ? 'существует' : 'отсутствует',
          };
        case 'docker-container-running': {
          const matches = state.containers.filter(c => c.status === 'running');
          const pass = check.image
            ? matches.some(c => c.image.startsWith(check.image))
            : check.name
            ? matches.some(c => c.name === check.name)
            : false;
          return {
            pass,
            expected: check.image ? 'контейнер с образом ' + check.image : 'контейнер ' + check.name,
            actual: pass ? 'running' : 'не найден',
          };
        }
        case 'docker-container-count':
          return {
            pass: state.containers.length === check.equals,
            expected: check.equals + ' контейнеров',
            actual: state.containers.length + ' контейнеров',
          };
        case 'docker-container-status': {
          const c = state.containers.find(cont => cont.name === check.name);
          return {
            pass: c && c.status === check.status,
            expected: check.name + ' = ' + check.status,
            actual: c ? c.status : 'контейнер не найден',
          };
        }
        case 'docker-port-mapped': {
          const c = state.containers.find(cont => cont.name === check.container);
          const hasPort = c && c.ports[check.host] === check.target;
          return {
            pass: hasPort,
            expected: check.host + ': ' + check.target,
            actual: c ? (c.ports[check.host] || 'нет порта') : 'контейнер не найден',
          };
        }
        case 'dockerfile-valid': {
          const df = sim._dockerfileResult;
          const pass = df && df.errors.length === 0;
          return {
            pass,
            expected: 'Dockerfile валиден',
            actual: df ? (pass ? 'валиден' : df.errors.join('; ')) : 'Dockerfile не найден',
          };
        }
        case 'dockerfile-has-instruction': {
          const df = sim._dockerfileResult;
          const pass = df && df.instructions.some(i => i.instruction === check.instruction.toUpperCase());
          return {
            pass,
            expected: 'инструкция ' + check.instruction,
            actual: df ? (pass ? 'найдена' : 'отсутствует') : 'Dockerfile не найден',
          };
        }
        case 'dockerfile-no-warnings': {
          const df = sim._dockerfileResult;
          let pass = df && df.warnings.length === 0 && df.hasUser;
          return {
            pass,
            expected: 'без предупреждений + USER nonroot',
            actual: df ? (pass ? 'чистый' : (df.warnings.join('; ') + (df.hasUser ? '' : '; нет USER'))) : 'Dockerfile не найден',
          };
        }
        case 'docker-volume-exists':
          return {
            pass: state.volumes.some(v => v.name === check.name),
            expected: 'volume ' + check.name,
            actual: state.volumes.some(v => v.name === check.name) ? 'существует' : 'отсутствует',
          };
        case 'docker-volume-mounted': {
          const c = state.containers.find(cont => cont.name === check.container);
          const mounted = c && c.volumes.some(v => v.source === check.source && v.target === check.target);
          return {
            pass: mounted,
            expected: check.container + ': ' + check.source + ' -> ' + check.target,
            actual: c ? (mounted ? 'примонтирован' : 'не найден') : 'контейнер не найден',
          };
        }
        case 'docker-network-exists':
          return {
            pass: state.networks.some(n => n.name === check.name),
            expected: 'network ' + check.name,
            actual: state.networks.some(n => n.name === check.name) ? 'существует' : 'отсутствует',
          };
        case 'docker-container-in-network': {
          const c = state.containers.find(cont => cont.name === check.container);
          const isInNet = c && (c.networks || []).includes(check.network);
          return {
            pass: isInNet,
            expected: check.container + ' в сети ' + check.network,
            actual: c ? (isInNet ? 'подключён' : 'не подключён') : 'контейнер не найден',
          };
        }
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
    const results = evaluateDockerChecks(opts.checks);
    const allPass = results.every(r => r.pass);
    if (allPass) {
      setStatus('✓ Верно', false);
      opts.onDockerPass?.();
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
      images: [],
      containers: [],
      volumes: [],
      networks: [
        { name: 'bridge', driver: 'bridge', ipam: { config: [{ subnet: '172.17.0.0/16' }] }, containers: [] },
      ],
      history: [],
      output: [],
      commandHistory: [],
      lastError: null,
      composeFile: null,
    };
    outputEl.innerHTML = '';
    statusPanelEl.innerHTML = '';
    appendOutput('Симулятор Docker сброшен.');
    setStatus('', false);
  }

    resetBtn.addEventListener('click', doReset);

  renderStatus();
  appendOutput('Добро пожаловать в Docker симулятор');
  appendOutput('Введите "docker help" для списка команд');

  return {
    execute: (cmd) => runCommand(cmd),
    getState: () => JSON.parse(JSON.stringify(sim.state)),
    getSim: () => sim,
    reset: doReset,
    setOpts,
    evaluateDockerChecks,
    container,
  };
}

