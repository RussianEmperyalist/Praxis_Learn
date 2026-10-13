function _hash() {
  const chars = '0123456789abcdef';
  let h = '';
  for (let i = 0; i < 12; i++) {
    h += chars[Math.floor(Math.random() * 16)];
  }
  return h;
}

export const imageLogs = {
  nginx: [
    '/docker-entrypoint.sh: /docker-entrypoint.d/10-listen-8080-on-rage.sh',
    '/docker-entrypoint.sh: /docker-entrypoint.d/20-env-dumper.sh',
    '/docker-entrypoint.sh: ready',
    'nginx: configuration test passed',
    'nginx: starting',
    'Server ready!',
  ],
  redis: [
    'Ready to start configuration update',
    'Redis 7.2 initialized',
    'Ready to accept connections tcp',
  ],
  postgres: [
    'PostgreSQL Database directory appears to be initialised',
    'database system is ready to accept connections',
  ],
  python: [
    'Python 3.12.0 (main, Oct 2023) [GCC 13.2.0]',
    '>>>',
  ],
};

export class DockerSim {
  constructor() {
    this.state = {
      images: [],
      containers: [],
      volumes: [],
      networks: [
        { name: 'bridge', driver: 'bridge', ipam: { config: [{ subnet: '172.17.0.0/16' }] }, containers: [] },
      ],
      history: [],
      output: [],
      lastError: null,
      commandHistory: [],
    };
  }

  _logCmd(cmd) {
    this.state.commandHistory = [...this.state.commandHistory, cmd];
  }

  _result() {
    const out = this.state.output.join('\n');
    return {
      output: [...this.state.output],
      error: this.state.lastError,
      state: JSON.parse(JSON.stringify(this.state)),
    };
  }

  _setError(msg) {
    this.state.output.push('docker: ' + msg);
    this.state.lastError = msg;
  }

  _findImage(spec) {
    if (!spec) return null;
    const parts = spec.split(':');
    const name = parts[0];
    const tag = parts[1] || 'latest';
    return this.state.images.find(img => img.name === name && img.tag === tag) || null;
  }

  _findContainer(idOrName) {
    return this.state.containers.find(
      c => c.id.startsWith(idOrName) || c.name === idOrName
    ) || null;
  }

  _findPort(hostPort) {
    return this.state.containers.find(
      c => Object.keys(c.ports).some(h => h === String(hostPort))
    ) || null;
  }

  execute(commandString) {
    const raw = commandString.trim();
    this.state.output = [];
    this.state.lastError = null;
    this._logCmd(raw);

    if (!raw) return this._result();

    const tokens = this._tokenize(raw);
    if (tokens.length === 0) return this._result();

    const cmd = tokens[0];
    const args = tokens.slice(1);

    if (cmd !== 'docker') {
      this.state.output.push("docker: '" + cmd + "' не является командой docker");
      return this._result();
    }

    const sub = args[0];
    const rest = args.slice(1);

    const handlers = {
      '--version': () => this._cmdVersion(),
      version: () => this._cmdVersion(),
      pull: () => this._cmdPull(rest),
      images: () => this._cmdImages(),
      rmi: () => this._cmdRmi(rest),
      build: () => this._cmdBuild(rest),
      run: () => this._cmdRun(rest),
      ps: () => this._cmdPs(rest),
      stop: () => this._cmdStop(rest),
      start: () => this._cmdStart(rest),
      restart: () => this._cmdRestart(rest),
      rm: () => this._cmdRm(rest),
      logs: () => this._cmdLogs(rest),
      exec: () => this._cmdExec(rest),
      inspect: () => this._cmdInspect(rest),
      help: () => this._cmdHelp(),
      prune: () => this._cmdPrune(),
    };

    if (!sub) {
      this._cmdHelp();
      return this._result();
    }

    const handler = handlers[sub];
    if (!handler) {
      this.state.output.push("docker: '" + sub + "' не поддерживается симулятором");
      this.state.output.push('Поддерживаются: pull, images, rmi, build, run, ps, stop, start, restart, rm, logs, exec, inspect, prune, help, version');
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
    this.state.output.push('Docker version 24.0.7, build 3e4y4c8');
  }

  _cmdPull(args) {
    const spec = args[0];
    if (!spec) {
      this._setError('не указан образ. Используйте: docker pull <image>');
      return;
    }
    const parts = spec.split(':');
    const name = parts[0];
    const tag = parts[1] || 'latest';

    if (this._findImage(spec)) {
      this.state.output.push('Образ уже существует: ' + spec);
      return;
    }

    const sizes = { nginx: '187MB', redis: '46MB', postgres: '106MB', python: '92MB', 'python:3.12-slim': '89MB' };
    const size = sizes[spec] || '120MB';

    this.state.images.push({
      name,
      tag,
      size,
      layers: [size],
      createdAt: Date.now(),
    });
    this.state.output.push('Digest: sha256:' + _hash());
    this.state.output.push('Status: Downloaded newer image for ' + name + ':' + tag);
    this.state.output.push(name + ':' + tag + ' загружен');
  }

  _cmdImages() {
    this.state.output.push('REPOSITORY   TAG       IMAGE ID     CREATED        SIZE');
    if (this.state.images.length === 0) {
      this.state.output.push('<none>       <none>    <none>      <none>         0B');
    } else {
      this.state.images.forEach(img => {
        const id = img.id || _hash().slice(0, 12);
        const line = (img.name + '   ').substring(0, 13) +
                     (img.tag + '       ').substring(0, 8) +
                     id + '   ' +
                     img.size;
        this.state.output.push(line);
      });
    }
  }

  _cmdRmi(args) {
    const spec = args[0];
    if (!spec) {
      this._setError('не указан образ. Используйте: docker rmi <image>');
      return;
    }

    const usedByContainers = this.state.containers.filter(c => {
      const img = this._findImage(c.image);
      return img && (c.image === spec || c.image === (spec.split(':')[0] + ':' + (spec.split(':')[1] || 'latest')));
    });

    if (usedByContainers.length > 0) {
      this._setError('image is being used by running container: ' + usedByContainers.map(c => c.name).join(', '));
      return;
    }

    const idx = this.state.images.findIndex(img => {
      const fullSpec = img.name + ':' + img.tag;
      return fullSpec === spec || img.name === spec || (img.name === spec.split(':')[0] && img.tag === (spec.split(':')[1] || 'latest'));
    });

    if (idx === -1) {
      this._setError('No such image: ' + spec);
      return;
    }

    const removed = this.state.images.splice(idx, 1)[0];
    this.state.output.push('Untagged: ' + removed.name + ':' + removed.tag);
    this.state.output.push('Deleted: ' + _hash());
  }

  _cmdBuild(args) {
    const tagIdx = args.indexOf('-t');
    if (tagIdx === -1 || !args[tagIdx + 1]) {
      this._setError('docker build требует -t <name>');
      return;
    }
    const name = args.slice(tagIdx + 1).find(a => !a.startsWith('-'));
    if (!name) {
      this._setError('не указано имя образа');
      return;
    }

    if (this._findImage(name)) {
      this.state.output.push('Образ уже существует: ' + name);
      return;
    }

    this.state.images.push({
      name: name.split(':')[0],
      tag: name.split(':')[1] || 'latest',
      size: '45MB',
      layers: ['base', 'RUN', 'COPY', 'COPY'],
      createdAt: Date.now(),
    });
    this.state.output.push('Sending build context to Docker daemon');
    this.state.output.push('Step 1/5 : FROM ...');
    this.state.output.push(' ---> abc1234');
    this.state.output.push('Successfully built ' + _hash());
    this.state.output.push('Successfully tagged ' + name);
  }

  _cmdRun(args) {
    let detached = false;
    let name = null;
    let ports = {};
    let volumes = [];
    let env = {};
    let rm = false;
    let imageSpec = null;
    let cmd = null;

    let i = 0;
    while (i < args.length) {
      const arg = args[i];
      if (arg === '-d' || arg === '--detach') {
        detached = true;
        i++;
      } else if (arg === '--name') {
        name = args[i + 1];
        i += 2;
      } else if (arg === '-p' || arg === '--publish') {
        const mapping = args[i + 1];
        if (mapping) {
          const parts = mapping.split(':');
          ports[parts[0]] = parts[1];
        }
        i += 2;
      } else if (arg === '-v' || arg === '--volume') {
        const mapping = args[i + 1];
        if (mapping) volumes.push(mapping);
        i += 2;
      } else if (arg === '-e' || arg === '--env') {
        const kv = args[i + 1];
        if (kv) {
          const parts = kv.split('=');
          env[parts[0]] = parts.slice(1).join('=');
        }
        i += 2;
      } else if (arg === '--rm') {
        rm = true;
        i++;
      } else if (!arg.startsWith('-') && !imageSpec) {
        imageSpec = arg;
        i++;
      } else if (!arg.startsWith('-') && imageSpec) {
        cmd = arg;
        i++;
      } else {
        i++;
      }
    }

    if (!imageSpec) {
      this._setError('не указан образ. Используйте: docker run <image>');
      return;
    }

    const image = this._findImage(imageSpec);
    if (!image) {
      this._setError('image not found: ' + imageSpec + '. Pull with: docker pull ' + imageSpec);
      return;
    }

    if (name && this._findContainer(name)) {
      this._setError('container name "' + name + '" already in use');
      return;
    }

    for (const hostPort of Object.keys(ports)) {
      const conflict = this._findPort(hostPort);
      if (conflict) {
        this._setError('port already in use: ' + hostPort + ' is bound to ' + conflict.name);
        return;
      }
    }

    const containerName = name || image.name.replace(/[-:.]/g, '_') + '_' + _hash().slice(0, 6);
    const container = {
      id: _hash(),
      image: image.name + ':' + image.tag,
      name: containerName,
      status: 'running',
      ports: ports,
      volumes: volumes,
      env: env,
      exitCode: null,
      logs: this._generateLogs(image.name, imageSpec),
      createdAt: Date.now(),
      rm: rm,
    };

    this.state.containers.push(container);
    this.state.output.push(container.id);

    if (!detached) {
      this.state.output.push('Attaching to ' + containerName);
    } else {
      this.state.output.push(containerName);
    }
  }

  _generateLogs(imageName, imageSpec) {
    const baseLogs = [
      'Container ' + imageName + ' started',
    ];
    const knownLogs = imageLogs[imageSpec] || imageLogs[imageName];
    if (knownLogs) {
      return [...baseLogs, ...knownLogs];
    }
    return baseLogs;
  }

  _cmdPs(args) {
    const all = args.includes('-a');
    const visible = all ? this.state.containers : this.state.containers.filter(c => c.status === 'running');

    this.state.output.push('CONTAINER ID   IMAGE          COMMAND       CREATED       STATUS       PORTS                    NAMES');
    if (visible.length === 0) {
      if (all) {
        this.state.output.push('(none)');
      } else {
        this.state.output.push('CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES');
      }
    } else {
      visible.forEach(c => {
        const id = c.id.slice(0, 12);
        const img = c.image;
        const cmd = c.image.includes('nginx') ? 'nginx' : c.image.includes('redis') ? 'redis-server' : c.image.includes('postgres') ? 'docker-entrypoint.sh' : c.image.includes('python') ? 'python3' : '';
        const ports = Object.keys(c.ports).length > 0
          ? Object.entries(c.ports).map(([h, t]) => '0.0.0.0:' + h + '->' + t + '/tcp').join(', ')
          : '';
        const age = c.createdAt ? '...seconds ago' : '';
        const line = (id + '   ').substring(0, 14) +
                     (img + '   ').substring(0, 14) +
                     (cmd + '   ').substring(0, 12) +
                     ('...' + '   ').substring(0, 16) +
                     (c.status + '     ').substring(0, 13) +
                     (ports + '   ').substring(0, 28) +
                     c.name;
        this.state.output.push(line);
      });
    }
  }

  _cmdStop(args) {
    const target = args[0];
    if (!target) {
      this._setError('не указан container');
      return;
    }
    const container = this._findContainer(target);
    if (!container) {
      this._setError('No such container: ' + target);
      return;
    }
    container.status = 'exited';
    container.exitCode = 0;
    this.state.output.push(container.name);
  }

  _cmdStart(args) {
    const target = args[0];
    if (!target) {
      this._setError('не указан container');
      return;
    }
    const container = this._findContainer(target);
    if (!container) {
      this._setError('No such container: ' + target);
      return;
    }
    container.status = 'running';
    this.state.output.push(container.name);
  }

  _cmdRestart(args) {
    const target = args[0];
    if (!target) {
      this._setError('не указан container');
      return;
    }
    const container = this._findContainer(target);
    if (!container) {
      this._setError('No such container: ' + target);
      return;
    }
    container.status = 'running';
    container.exitCode = null;
    this.state.output.push(container.name);
  }

  _cmdRm(args) {
    const target = args[0];
    if (!target) {
      this._setError('не указан container');
      return;
    }
    const container = this._findContainer(target);
    if (!container) {
      this._setError('No such container: ' + target);
      return;
    }
    if (container.status === 'running') {
      this._setError('cannot remove running container: ' + container.name + ' (use docker stop first)');
      return;
    }
    const idx = this.state.containers.indexOf(container);
    this.state.containers.splice(idx, 1);
    this.state.output.push(container.id);
  }

  _cmdLogs(args) {
    const target = args[0];
    if (!target) {
      this._setError('не указан container');
      return;
    }
    const container = this._findContainer(target);
    if (!container) {
      this._setError('No such container: ' + target);
      return;
    }
    if (container.logs && container.logs.length > 0) {
      this.state.output.push(...container.logs);
    } else {
      this.state.output.push('Нет логов');
    }
  }

  _cmdExec(args) {
    let target = null;
    let cmd = '';
    let interactive = false;

    let i = 0;
    while (i < args.length) {
      const arg = args[i];
      if (arg === '-it' || arg === '-i' || arg === '-t') {
        interactive = true;
        i++;
      } else if (!target) {
        target = arg;
        i++;
      } else {
        cmd = arg;
        i++;
      }
    }

    if (!target) {
      this._setError('не указан container');
      return;
    }

    const container = this._findContainer(target);
    if (!container) {
      this._setError('No such container: ' + target);
      return;
    }

    if (container.status !== 'running') {
      this._setError('Container ' + container.name + ' is not running');
      return;
    }

    if (cmd === 'ls' || cmd === 'ls -la') {
      if (container.image.includes('nginx')) {
        this.state.output.push('bin\ndocker-entrypoint.sh\nlib\nproc\nsetuptools.pyp');
      } else if (container.image.includes('python')) {
        this.state.output.push('__pycache__\napp\t\tbin\tboot\t\tdev');
      } else {
        this.state.output.push('bin\tboot\t\tdev\tes\thome\tlib');
      }
    } else if (cmd === 'env') {
      Object.entries(container.env).forEach(([k, v]) => {
        this.state.output.push(k + '=' + v);
      });
    } else if (cmd === 'cat') {
      const fileArg = args[args.length - 1];
      this.state.output.push('Content of ' + fileArg + ' in ' + container.name);
      this.state.output.push('# ' + fileArg + ' (simulated)');
    } else if (cmd === 'sh' || cmd === 'bash') {
      this.state.output.push(container.name + ' / $ ');
    } else {
      this.state.output.push('Command "' + cmd + '" executed in container ' + container.name + ' (simulated)');
    }
  }

  _cmdInspect(args) {
    const target = args[0];
    if (!target) {
      this._setError('не указан container или image');
      return;
    }

    const container = this._findContainer(target);
    if (container) {
      const info = {
        Id: container.id,
        Name: container.name,
        Image: container.image,
        State: {
          Status: container.status,
          Running: container.status === 'running',
          ExitCode: container.exitCode,
        },
        HostConfig: {
          PortBindings: Object.entries(container.ports).reduce((acc, [h, t]) => {
            acc[h + '/tcp'] = [{ HostPort: h, ContainerPort: t }];
            return acc;
          }, {}),
        },
        NetworkSettings: {
          Ports: Object.entries(container.ports).reduce((acc, [h, t]) => {
            acc[h + '/tcp'] = [{ HostIp: '0.0.0.0', HostPort: h }];
            return acc;
          }, {}),
        },
      };
      this.state.output.push(JSON.stringify(info, null, 2));
    } else {
      const img = this._findImage(target);
      if (img) {
        const info = {
          Id: 'sha256:' + _hash() + _hash(),
          RepoTags: [img.name + ':' + img.tag],
          Size: img.size,
          Created: new Date(img.createdAt).toISOString(),
        };
        this.state.output.push(JSON.stringify(info, null, 2));
      } else {
        this._setError('No such container or image: ' + target);
      }
    }
  }

  _cmdPrune() {
    const stopped = this.state.containers.filter(c => c.status === 'exited');
    const before = this.state.containers.length;
    this.state.containers = this.state.containers.filter(c => c.status === 'running');
    const removed = before - this.state.containers.length;
    this.state.output.push('Removed ' + removed + ' stopped containers');
    const imageCount = this.state.images.filter(img => {
      return !this.state.containers.some(c => c.image.startsWith(img.name + ':'));
    }).length;
    this.state.images = this.state.images.filter(img => {
      return this.state.containers.some(c => c.image.startsWith(img.name + ':'));
    });
    if (imageCount > 0) {
      this.state.output.push('Removed ' + imageCount + ' dangling images');
    }
    this.state.output.push('Total reclaimed: ' + removed + ' items');
  }

  _cmdHelp() {
    this.state.output.push('Используйте: docker <команда> [опции]');
    this.state.output.push('');
    this.state.output.push('Команды:');
    this.state.output.push('  run     Создать и запустить контейнер');
    this.state.output.push('  ps      Показать работающие контейнеры');
    this.state.output.push('  pull    Загрузить образ');
    this.state.output.push('  images  Показать образы');
    this.state.output.push('  build   Собрать образ из Dockerfile');
    this.state.output.push('  stop    Остановить контейнер');
    this.state.output.push('  start   Запустить контейнер');
    this.state.output.push('  rm      Удалить остановленный контейнер');
    this.state.output.push('  logs    Показать логи контейнера');
    this.state.output.push('  exec    Выполнить команду в контейнере');
    this.state.output.push('  inspect Показать информацию о контейнере/образе');
    this.state.output.push('  rmi     Удалить образ');
    this.state.output.push('  prune   Очистить остановленные контейнеры и образы');
  }
}
