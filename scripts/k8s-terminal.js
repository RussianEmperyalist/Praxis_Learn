import { K8sSim } from './k8s-simulator.js';

export function createK8sTerminal(mountEl, initialState) {
  const sim = new K8sSim();
  if (initialState) {
    sim.state = JSON.parse(JSON.stringify(initialState));
  }

  const container = document.createElement('div');
  container.className = 'k8s-terminal-container';
  container.innerHTML = `
    <div class="k8s-terminal">
      <div class="k8s-terminal-output" id="k8sOutput"></div>
      <div class="k8s-terminal-input-line">
        <span class="k8s-prompt" style="color: #7ee787;">$</span>
        <input type="text" id="k8sInput" class="k8s-input" autocomplete="off" spellcheck="false" placeholder="Введите kubectl команду..." />
      </div>
      <div class="k8s-terminal-footer">
        <button class="btn btn-primary btn-sm" id="k8sCheckBtn">Проверить</button>
        <button class="btn btn-ghost btn-sm" id="k8sResetBtn">Сбросить</button>
        <span class="k8s-status" id="k8sStatus"></span>
      </div>
    </div>
    <div class="k8s-state-panel" id="k8sStatePanel"></div>
  `;

  mountEl.appendChild(container);

  const outputEl = container.querySelector('#k8sOutput');
  const inputEl = container.querySelector('#k8sInput');
  const statusPanelEl = container.querySelector('#k8sStatePanel');
  const checkBtn = container.querySelector('#k8sCheckBtn');
  const resetBtn = container.querySelector('#k8sResetBtn');
  const statusEl = container.querySelector('#k8sStatus');

  const renderStatus = () => {
    const s = sim.state;
    let html = '';
    html += '<div class="k8s-status-title">Кластер: ' + s.cluster.name + ' (v' + s.cluster.version + ')</div>';
    html += '<div class="k8s-status-section"><b>Nodes:</b> ' + s.nodes.length + '</div>';
    html += '<div class="k8s-status-section"><b>Pods:</b> ' + s.pods.length + '</div>';
    html += '<div class="k8s-status-section"><b>Deployments:</b> ' + s.deployments.length + '</div>';
    html += '<div class="k8s-status-section"><b>Services:</b> ' + s.services.length + '</div>';

    if (s.pods.length > 0) {
      html += '<div class="k8s-status-subtitle">Pods:</div>';
      s.pods.forEach(p => {
        html += '<div class="k8s-status-item">' + p.name + ' — ' + p.status + ' (' + p.node + ')</div>';
      });
    }
    if (s.deployments.length > 0) {
      html += '<div class="k8s-status-subtitle">Deployments:</div>';
      s.deployments.forEach(d => {
        html += '<div class="k8s-status-item">' + d.name + ' — ' + d.ready + '/' + d.replicas + ' ready</div>';
      });
    }
    if (s.services.length > 0) {
      html += '<div class="k8s-status-subtitle">Services:</div>';
      s.services.forEach(svc => {
        html += '<div class="k8s-status-item">' + svc.name + ' — ' + svc.type + ' (' + svc.clusterIP + ')</div>';
      });
    }
    if (s.configmaps.length > 0) {
      html += '<div class="k8s-status-subtitle">ConfigMaps:</div>';
      s.configmaps.forEach(cm => {
        html += '<div class="k8s-status-item">' + cm.name + '</div>';
      });
    }
    if (s.secrets.length > 0) {
      html += '<div class="k8s-status-subtitle">Secrets:</div>';
      s.secrets.forEach(sec => {
        html += '<div class="k8s-status-item">' + sec.name + '</div>';
      });
    }

    statusPanelEl.innerHTML = html;
  };

  let history = [];
  let historyIndex = -1;

  function appendOutput(text, isError = false) {
    const div = document.createElement('div');
    div.className = isError ? 'k8s-output-error' : 'k8s-output-line';
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

  const CHECK_TYPE_MAP = {
    'k8s-pod-exists': 'pod-exists',
    'k8s-pod-running': 'pod-running',
    'k8s-pod-count': 'pod-count',
    'k8s-deployment-exists': 'deployment-exists',
    'k8s-deployment-replicas': 'deployment-replicas',
    'k8s-service-exists': 'service-exists',
    'k8s-service-type': 'service-type',
    'k8s-configmap-exists': 'configmap-exists',
    'k8s-secret-exists': 'secret-exists',
    'k8s-command-used': 'command-used',
  };

  const CHECKS = {
    'command-used'(check, sim) {
      const cmd = check.params?.contains || check.contains;
      const used = sim.state.commandHistory.some(c => c.includes(cmd));
      return {
        pass: used,
        expected: 'команда содержит ' + cmd,
        actual: used ? 'выполнена' : 'не выполнена',
      };
    },
    'pod-exists'(check, sim) {
      const name = check.params?.name || check.name;
      const pod = sim.state.pods.find(p => p.name === name);
      return {
        pass: !!pod,
        expected: 'под ' + name,
        actual: pod ? 'существует' : 'не найден',
      };
    },
    'pod-running'(check, sim) {
      const name = check.params?.name || check.name;
      const pod = sim.state.pods.find(p => p.name === name);
      const running = pod && pod.status === 'Running';
      return {
        pass: !!running,
        expected: 'под ' + name + ' в статусе Running',
        actual: running ? 'Running' : (pod ? pod.status : 'не найден'),
      };
    },
    'pod-count'(check, sim) {
      const expected = check.params?.equals || check.equals;
      const actual = sim.state.pods.length;
      return {
        pass: actual === expected,
        expected: expected + ' подов',
        actual: actual + ' подов',
      };
    },
    'deployment-exists'(check, sim) {
      const name = check.params?.name || check.name;
      const dep = sim.state.deployments.find(d => d.name === name);
      return {
        pass: !!dep,
        expected: 'deployment ' + name,
        actual: dep ? 'существует' : 'не найден',
      };
    },
    'deployment-replicas'(check, sim) {
      const name = check.params?.name || check.name;
      const expected = check.params?.replicas || check.replicas;
      const dep = sim.state.deployments.find(d => d.name === name);
      const actual = dep ? dep.replicas : 0;
      return {
        pass: actual === expected,
        expected: name + ' имеет ' + expected + ' реплик',
        actual: actual + ' реплик',
      };
    },
    'service-exists'(check, sim) {
      const name = check.params?.name || check.name;
      const svc = sim.state.services.find(s => s.name === name);
      return {
        pass: !!svc,
        expected: 'service ' + name,
        actual: svc ? 'существует' : 'не найден',
      };
    },
    'service-type'(check, sim) {
      const name = check.params?.name || check.name;
      const expectedType = check.params?.type || check.type;
      const svc = sim.state.services.find(s => s.name === name);
      const matches = svc && svc.type === expectedType;
      return {
        pass: !!matches,
        expected: name + ' тип ' + expectedType,
        actual: svc ? svc.type : 'не найден',
      };
    },
    'configmap-exists'(check, sim) {
      const name = check.params?.name || check.name;
      const cm = sim.state.configmaps.find(c => c.name === name);
      return {
        pass: !!cm,
        expected: 'configmap ' + name,
        actual: cm ? 'существует' : 'не найден',
      };
    },
    'secret-exists'(check, sim) {
      const name = check.params?.name || check.name;
      const sec = sim.state.secrets.find(s => s.name === name);
      return {
        pass: !!sec,
        expected: 'secret ' + name,
        actual: sec ? 'существует' : 'не найден',
      };
    },
  };

  function evaluateK8sChecks(checks) {
    return checks.map(check => {
      const kind = check.kind || check.type;
      const mapped = CHECK_TYPE_MAP[kind];
      if (!mapped) {
        return { pass: true, expected: 'неизвестно', actual: 'ок' };
      }
      return CHECKS[mapped](check, sim);
    });
  }

  checkBtn.addEventListener('click', () => {
    if (!opts || !opts.checks || opts.checks.length === 0) {
      setStatus('Нет проверок', false);
      return;
    }
    const results = evaluateK8sChecks(opts.checks);
    const allPass = results.every(r => r.pass);
    if (allPass) {
      setStatus('✓ Верно', false);
      opts.onK8sPass?.();
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
      cluster: { name: 'minikube', version: '1.29' },
      nodes: [
        { name: 'minikube', status: 'Ready', roles: 'control-plane,master' },
      ],
      pods: [],
      deployments: [],
      services: [],
      configmaps: [],
      secrets: [],
      history: [],
      output: [],
      lastError: null,
      commandHistory: [],
      currentManifest: null,
    };
    outputEl.innerHTML = '';
    statusPanelEl.innerHTML = '';
    appendOutput('Симулятор Kubernetes сброшен.');
    setStatus('', false);
  }

  resetBtn.addEventListener('click', doReset);

  renderStatus();
  appendOutput('Добро пожаловать в Kubernetes симулятор');
  appendOutput('Введите "kubectl help" для списка команд');

  return {
    execute: (cmd) => runCommand(cmd),
    getState: () => JSON.parse(JSON.stringify(sim.state)),
    getSim: () => sim,
    reset: doReset,
    setOpts,
    evaluateK8sChecks,
    container,
  };
}

