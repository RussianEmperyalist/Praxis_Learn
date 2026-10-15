import { parseYaml, validateK8sManifest } from './yaml-validator.js';

export class K8sSim {
  constructor() {
    this.state = {
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
  }

  _result() {
    return {
      output: [...this.state.output],
      error: this.state.lastError,
      state: JSON.parse(JSON.stringify(this.state)),
    };
  }

  _setError(msg) {
    this.state.output.push('kubectl: ' + msg);
    this.state.lastError = msg;
  }

  execute(commandString) {
    const raw = commandString.trim();
    this.state.output = [];
    this.state.lastError = null;
    this.state.commandHistory = [...this.state.commandHistory, raw];

    if (!raw) return this._result();

    const tokens = this._tokenize(raw);
    if (tokens.length === 0) return this._result();

    const cmd = tokens[0];
    const args = tokens.slice(1);

    if (cmd !== 'kubectl' && cmd !== 'k') {
      this.state.output.push("kubectl: '" + cmd + "' не является командой kubectl");
      return this._result();
    }

    const sub = args[0];
    const rest = args.slice(1);

    if (!sub) {
      this._cmdHelp();
      return this._result();
    }

    const handlers = {
      version: () => this._cmdVersion(),
      get: () => this._cmdGet(rest),
      describe: () => this._cmdDescribe(rest),
      apply: () => this._cmdApply(rest),
      delete: () => this._cmdDelete(rest),
      scale: () => this._cmdScale(rest),
      logs: () => this._cmdLogs(rest),
      exec: () => this._cmdExec(rest),
      help: () => this._cmdHelp(),
    };

    const handler = handlers[sub];
    if (!handler) {
      this.state.output.push("kubectl: '" + sub + "' не поддерживается");
      this.state.output.push('Поддерживаются: version, get, describe, apply, delete, scale, logs, exec, help');
      return this._result();
    }

    handler();
    return this._result();
  }

  _tokenize(str) {
    const tokens = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (inQuote) {
        if (ch === quoteChar) {
          inQuote = false;
          tokens.push(current);
          current = '';
        } else {
          current += ch;
        }
      } else if (ch === '"' || ch === "'") {
        if (current === '') {
          inQuote = true;
          quoteChar = ch;
        } else {
          current += ch;
        }
      } else if (ch === ' ') {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += ch;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }

  _cmdVersion() {
    this.state.output.push('Client Version: v1.29.0');
    this.state.output.push('Server Version: ' + this.state.cluster.version);
  }

  _cmdGet(args) {
    const valid = args[0];
    const namespace = this._extractNamespace(args);

    if (valid === 'nodes' || valid === 'no') {
      this.state.output.push('NAME        STATUS   ROLES                       AGE');
      this.state.nodes.forEach(n => {
        this.state.output.push(n.name + '   ' + n.status + '   ' + n.roles + '   ' + '1d');
      });
      return;
    }

    if (valid === 'pods' || valid === 'po') {
      const pods = namespace
        ? this.state.pods.filter(p => p.namespace === namespace)
        : this.state.pods;
      if (pods.length === 0) {
        this.state.output.push('No resources found in ' + (namespace || 'default') + ' namespace.');
      } else {
        this.state.output.push('NAME                        READY   STATUS    RESTARTS   AGE');
        pods.forEach(p => {
          const ready = p.ready !== undefined ? p.ready : 1;
          this.state.output.push(p.name + '   ' + (ready + '/' + (p.containers || 1)) + '   ' + p.status + '   ' + '0' + '   ' + '1m');
        });
      }
      return;
    }

    if (valid === 'deployments' || valid === 'deploy') {
      if (this.state.deployments.length === 0) {
        this.state.output.push('No resources found.');
      } else {
        this.state.output.push('NAME             READY   UP-TO-DATE   AVAILABLE   AGE');
        this.state.deployments.forEach(d => {
          this.state.output.push(d.name + '   ' + (d.ready + '/' + d.replicas) + '   ' + d.replicas + '   ' + d.ready + '   ' + '1m');
        });
      }
      return;
    }

    if (valid === 'services' || valid === 'svc') {
      if (this.state.services.length === 0) {
        this.state.output.push('No resources found.');
      } else {
        this.state.output.push('NAME         TYPE         CLUSTER-IP     PORT(S)                     AGE');
        this.state.services.forEach(s => {
          const ports = s.ports.map(p => p.port + ':' + (p.targetPort || p.port)).join(', ');
          this.state.output.push(s.name + '   ' + s.type + '   ' + s.clusterIP + '   ' + ports + '   1m');
        });
      }
      return;
    }

    if (valid === 'configmaps' || valid === 'cm') {
      if (this.state.configmaps.length === 0) {
        this.state.output.push('No resources found.');
      } else {
        this.state.output.push('NAME              DATA   AGE');
        this.state.configmaps.forEach(cm => {
          this.state.output.push(cm.name + '   ' + Object.keys(cm.data || {}).length + '   1m');
        });
      }
      return;
    }

    if (valid === 'secrets') {
      if (this.state.secrets.length === 0) {
        this.state.output.push('No resources found.');
      } else {
        this.state.output.push('NAME         TYPE                       DATA   AGE');
        this.state.secrets.forEach(s => {
          const dataKeys = Object.keys(s.data || {});
          this.state.output.push(s.name + '   Opaque   ' + dataKeys.length + '   1m');
        });
      }
      return;
    }

    this.state.output.push('kubectl get: поддерживаются pods, deployments, services, nodes, configmaps, secrets');
  }

  _extractNamespace(args) {
    const idx = args.indexOf('-n');
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
    return null;
  }

  _cmdDescribe(args) {
    const kind = args[0];
    const name = args[1];

    if (kind === 'pod' || kind === 'po') {
      const pod = this.state.pods.find(p => p.name === name);
      if (!pod) {
        this._setError('pod "' + name + '" not found');
        return;
      }
      this.state.output.push('Name:         ' + pod.name);
      this.state.output.push('Namespace:    ' + pod.namespace);
      this.state.output.push('Status:       ' + pod.status);
      this.state.output.push('Node:         ' + pod.node);
      this.state.output.push('Containers:   ' + (pod.containers || 1));
      this.state.output.push('Image:        ' + pod.image);
      return;
    }

    if (kind === 'deployment' || kind === 'deploy') {
      const dep = this.state.deployments.find(d => d.name === name);
      if (!dep) {
        this._setError('deployment "' + name + '" not found');
        return;
      }
      this.state.output.push('Name:                   ' + dep.name);
      this.state.output.push('Namespace:              default');
      this.state.output.push('Replicas:               ' + dep.replicas);
      this.state.output.push('Ready:                  ' + dep.ready);
      this.state.output.push('Selector:               app=' + dep.name);
      return;
    }

    if (kind === 'service' || kind === 'svc') {
      const svc = this.state.services.find(s => s.name === name);
      if (!svc) {
        this._setError('service "' + name + '" not found');
        return;
      }
      this.state.output.push('Name:             ' + svc.name);
      this.state.output.push('Namespace:        default');
      this.state.output.push('Type:             ' + svc.type);
      this.state.output.push('Cluster-IP:       ' + svc.clusterIP);
      this.state.output.push('Selector:         ' + JSON.stringify(svc.selector || {}));
      this.state.output.push('Ports:            ' + JSON.stringify(svc.ports));
      return;
    }

    if (kind === 'node') {
      const node = this.state.nodes.find(n => n.name === name) || this.state.nodes[0];
      if (!node) {
        this._setError('node not found');
        return;
      }
      this.state.output.push('Name:                 ' + node.name);
      this.state.output.push('Status:               ' + node.status);
      this.state.output.push('Roles:                ' + node.roles);
      this.state.output.push('Capacity:             cpu=2, memory=4Gi');
      return;
    }

    this.state.output.push('kubectl describe: поддерживаются pod, deployment, service, node');
  }

  _cmdApply(args) {
    const fileIdx = args.indexOf('-f');
    if (fileIdx === -1) {
      this._setError('kubectl apply требует -f <file>');
      return;
    }

    const manifest = this.state.currentManifest;
    if (!manifest) {
      this._setError('композитный файл не загружен. Используйте kubectl apply -f <file>');
      return;
    }

    const { data, error } = parseYaml(manifest);
    if (error) {
      this._setError('YAML parse error: ' + error);
      return;
    }

    const validation = validateK8sManifest(data);
    if (!validation.valid) {
      this._setError('invalid manifest: ' + validation.errors.join(', '));
      return;
    }

    const kind = data.kind;
    const meta = data.metadata || {};

    if (kind === 'Pod') {
      const existing = this.state.pods.find(p => p.name === meta.name);
      if (existing) {
        Object.assign(existing, {
          image: (data.spec && data.spec.containers && data.spec.containers[0]) ? data.spec.containers[0].image : existing.image,
          status: 'Running',
          ready: true,
          namespace: meta.namespace || 'default',
          node: this.state.nodes[0]?.name || 'minikube',
          containers: data.spec?.containers?.length || 1,
        });
      } else {
        this.state.pods.push({
          name: meta.name,
          namespace: meta.namespace || 'default',
          status: 'Running',
          ready: 1,
          image: data.spec?.containers?.[0]?.image || 'unknown',
          node: this.state.nodes[0]?.name || 'minikube',
          containers: data.spec?.containers?.length || 1,
        });
      }
      this.state.output.push('pod/' + meta.name + ' created');
    } else if (kind === 'Deployment') {
      const existing = this.state.deployments.find(d => d.name === meta.name);
      const replicas = data.spec?.replicas || 1;
      const image = data.spec?.template?.spec?.containers?.[0]?.image || 'unknown';
      if (existing) {
        existing.replicas = replicas;
        existing.ready = replicas;
        existing.image = image;
      } else {
        this.state.deployments.push({
          name: meta.name,
          replicas: replicas,
          ready: replicas,
          image: image,
        });
      }
      this.state.output.push('deployment.apps/' + meta.name + ' created');
    } else if (kind === 'Service') {
      const existing = this.state.services.find(s => s.name === meta.name);
      const svc = {
        name: meta.name,
        type: data.spec?.type || 'ClusterIP',
        clusterIP: this._randomIP(),
        ports: data.spec?.ports || [],
        selector: data.spec?.selector || {},
      };
      if (existing) {
        Object.assign(existing, svc);
      } else {
        this.state.services.push(svc);
      }
      this.state.output.push('service/' + meta.name + ' created');
    } else if (kind === 'ConfigMap') {
      const existing = this.state.configmaps.find(c => c.name === meta.name);
      const cm = {
        name: meta.name,
        namespace: meta.namespace || 'default',
        data: data.data || {},
      };
      if (existing) {
        existing.data = cm.data;
      } else {
        this.state.configmaps.push(cm);
      }
      this.state.output.push('configmap/' + meta.name + ' created');
    } else if (kind === 'Secret') {
      const existing = this.state.secrets.find(s => s.name === meta.name);
      const sec = {
        name: meta.name,
        namespace: meta.namespace || 'default',
        data: data.data || {},
      };
      if (existing) {
        sec.data = sec.data;
      } else {
        this.state.secrets.push(sec);
      }
      this.state.output.push('secret/' + meta.name + ' created');
    } else if (kind === 'Namespace') {
      this.state.output.push('namespace/' + meta.name + ' created');
    } else {
      this._setError('kind ' + kind + ' не поддерживается в симуляторе');
      return;
    }

    this.state.output.push('');
  }

  _cmdDelete(args) {
    const fileIdx = args.indexOf('-f');
    const kind = args[0];
    const name = args[1];

    if (fileIdx !== -1) {
      const manifest = this.state.currentManifest;
      if (!manifest) {
        this._setError('композитный файл не загружен');
        return;
      }
      const { data } = parseYaml(manifest);
      if (data && data.kind && data.metadata && data.metadata.name) {
        this._deleteObject(data.kind, data.metadata.name);
        return;
      }
    }

    if (!kind || !name) {
      this._setError('kubectl delete требует <type> <name> или -f <file>');
      return;
    }

    this._deleteObject(kind, name);
  }

  _deleteObject(kind, name) {
    let list, singular;

    switch (kind) {
      case 'pod':
      case 'po':
        list = this.state.pods;
        singular = 'pod';
        break;
      case 'deployment':
      case 'deploy':
        list = this.state.deployments;
        singular = 'deployment';
        break;
      case 'service':
      case 'svc':
        list = this.state.services;
        singular = 'service';
        break;
      case 'configmap':
      case 'cm':
        list = this.state.configmaps;
        singular = 'configmap';
        break;
      case 'secret':
        list = this.state.secrets;
        singular = 'secret';
        break;
      case 'node':
        list = this.state.nodes;
        singular = 'node';
        break;
      default:
        this._setError(kind + ' не поддерживается');
        return;
    }

    const idx = list.findIndex(obj => obj.name === name);
    if (idx === -1) {
      this._setError(singular + ' "' + name + '" not found');
      return;
    }

    list.splice(idx, 1);
    this.state.output.push(singular + '/' + name + ' deleted');
  }

  _cmdScale(args) {
    let nameIdx = 0;
    if (args[0] === 'deployment' || args[0] === 'deploy' || args[0] === 'deployments') {
      nameIdx = 1;
    }
    const depName = args[nameIdx];
    let replicas = null;

    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--replicas=')) {
        replicas = parseInt(arg.split('=')[1]);
      } else if (arg === '--replicas' && args[i + 1]) {
        const next = args[i + 1];
        replicas = parseInt(next.includes('=') ? next.split('=')[1] : next);
      }
    }

    if (replicas === null || isNaN(replicas)) {
      this._setError('kubectl scale требует --replicas=N');
      return;
    }

    const dep = this.state.deployments.find(d => d.name === depName);
    if (!dep) {
      this._setError('deployment "' + depName + '" not found');
      return;
    }

    dep.replicas = replicas;
    dep.ready = replicas;

    this.state.output.push('deployment.apps/' + depName + ' scaled');
    this.state.output.push('');
    this.state.output.push('NAME               READY   UP-TO-DATE   AVAILABLE   AGE');
    this.state.output.push(depName + '   ' + (dep.ready + '/' + dep.replicas) + '   ' + dep.replicas + '   ' + dep.ready + '   1m');
  }

  _cmdLogs(args) {
    const name = args[0];
    if (!name) {
      this._setError('kubectl logs требует pod name');
      return;
    }
    const pod = this.state.pods.find(p => p.name === name);
    if (!pod) {
      this._setError('pod "' + name + '" not found');
      return;
    }
    const logs = this._getPodLogs(pod);
    logs.forEach(l => this.state.output.push(l));
  }

  _getPodLogs(pod) {
    const imageName = pod.image || '';
    if (imageName.includes('nginx')) {
      return [
        pod.name + ' ' + '1/"1"/*1',
        '10.0.0.1 - - [14/Oct/2024:10:00:00 +0000] "GET / HTTP/1.1" 200 612 "-" "curl/7.68.0"',
        '10.0.0.1 - - [14/Oct/2024:10:00:01 +0000] "GET /favicon.ico HTTP/1.1" 404 153 "-" "curl/7.68.0"',
      ];
    }
    if (imageName.includes('redis')) {
      return [
        'Ready to start configuration update',
        'Redis 7.2 initialized',
        'Ready to accept connections tcp',
      ];
    }
    if (imageName.includes('postgres')) {
      return [
        'PostgreSQL Database directory appears to be initialised',
        'database system is ready to accept connections',
      ];
    }
    return [
      'Pod ' + pod.name + ' started',
      'Listening on :8080',
    ];
  }

  _cmdExec(args) {
    const podIdx = args.findIndex(a => !a.startsWith('-') && a !== '--');
    if (podIdx === -1) {
      this._setError('kubectl exec требует pod name');
      return;
    }
    const podName = args[podIdx];
    const cmdArgs = args.slice(podIdx + 1);
    const cmdStr = cmdArgs.join(' ');

    const pod = this.state.pods.find(p => p.name === podName);
    if (!pod) {
      this._setError('pod "' + podName + '" not found');
      return;
    }
    if (pod.status !== 'Running') {
      this._setError('pod "' + podName + '" is not running');
      return;
    }

    if (cmdStr.includes('ls') || cmdStr.includes('ps')) {
      this.state.output.push('PID   USER   TIME  CMD');
      this.state.output.push('1     root   0:00  ' + (pod.image.includes('/') ? pod.image.split('/').pop() : pod.image));
      this.state.output.push('12    root   0:00  ' + (cmdStr || 'sh'));
    } else if (cmdStr.includes('env')) {
      const env = pod.env || {};
      Object.entries(env).forEach(([k, v]) => {
        this.state.output.push(k + '=' + v);
      });
    } else if (cmdStr.includes('cat')) {
      const file = cmdArgs[cmdArgs.length - 1];
      this.state.output.push('Content of ' + file);
      this.state.output.push('Simulated content for ' + file);
    } else {
      this.state.output.push(pod.name + ' $ ' + cmdStr);
    }
  }

  _cmdHelp() {
    this.state.output.push('Используйте: kubectl <команда> [опции]');
    this.state.output.push('');
    this.state.output.push('Команды:');
    this.state.output.push('  version    Показать версию клиента и сервера');
    this.state.output.push('  get        Показать объекты (pods, deployments, svc, nodes, cm)');
    this.state.output.push('  describe   Подробная информация об объекте');
    this.state.output.push('  apply      Применить манифест (-f)');
    this.state.output.push('  delete     Удалить объект');
    this.state.output.push('  scale      Масштабировать deployment');
    this.state.output.push('  logs       Показать логи пода');
    this.state.output.push('  exec       Выполнить команду в поде');
  }

  _randomIP() {
    return '10.0.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255);
  }

  setManifest(yamlText) {
    this.state.currentManifest = yamlText;
  }
}

