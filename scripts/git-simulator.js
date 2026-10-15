export class GitSim {
  constructor() {
    this.state = {
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
  }

  _hash() {
    const chars = '0123456789abcdef';
    let h = '';
    for (let i = 0; i < 7; i++) {
      h += chars[Math.floor(Math.random() * 16)];
    }
    return h;
  }

  _currentCommit() {
    if (!this.state.head) return null;
    if (this.state.head.type === 'branch') {
      return this.state.branches[this.state.head.name] || null;
    }
    return this.state.head.hash || null;
  }

  _getCommit(hash) {
    return this.state.commits.find(c => c.hash === hash) || null;
  }

  _formatStatus(status) {
    const lines = [];
    const staged = Object.keys(this.state.staged);
    const working = Object.keys(this.state.working).filter(
      f => this.state.staged[f] !== this.state.working[f]
    );
    const untracked = Object.keys(this.state.working).filter(
      f => !(f in this.state.staged)
    );

    if (this.state.head === null) {
      if (staged.length > 0) {
        lines.push('Изменения в индексе:');
        staged.forEach(f => lines.push(`  новый файл: ${f}`));
      }
      if (working.length > 0) lines.push('...working');
    } else {
      const lastHash = this._currentCommit();
      const lastCommit = this._getCommit(lastHash);
      const tracked = lastCommit ? Object.keys(lastCommit.files) : [];

      const modified = [];
      const unmodified = [];
      const deleted = [];

      Object.keys(this.state.working).forEach(f => {
        const w = this.state.working[f];
        const s = this.state.staged[f];
        const t = lastCommit?.files[f];

        if (w !== t) {
          if (s === w) {
            unmodified.push(f);
          } else {
            modified.push(f);
          }
        }
      });

      tracked.forEach(f => {
        if (!(f in this.state.working)) {
          if (s === undefined) deleted.push(f);
        } else if (this.state.working[f] === lastCommit.files[f]) {
          unmodified.push(f);
        }
      });

      untracked.forEach(f => {
        if (!tracked.includes(f)) modified.push(f);
      });

      if (staged.length > 0) {
        lines.push('Изменения в индексе:');
        staged.forEach(f => {
          if (!tracked.includes(f)) lines.push(`  новый файл: ${f}`);
          else if (this.state.staged[f] !== lastCommit.files[f]) lines.push(`  изменён: ${f}`);
        });
      }

      if (modified.length > 0) {
        lines.push('Изменения, не в индексе:');
        modified.forEach(f => lines.push(`  изменён: ${f}`));
      }

      if (lines.length === 0) lines.push('Рабочее дерево чистое');
    }

    return lines.join('\n');
  }

  _log(state, opts = {}) {
    const out = [];
    const commits = [...this.state.commits].reverse();
    commits.forEach(c => {
      const time = new Date(c.timestamp).toISOString().slice(0, 10);
      if (opts.oneline) {
        out.push(`${c.hash} ${c.message}`);
      } else {
        out.push(`commit ${c.hash}`);
        out.push(`Author: ${c.author} <${c.author}@example.com}>`);
        out.push(`Date:   ${time}`);
        out.push('');
        out.push(`    ${c.message}`);
        out.push('');
      }
    });
    return out;
  }

  execute(commandString) {
    const raw = commandString.trim();
    this.state.output = [];
    this.state.lastError = null;
    this.state.commandHistory = [...this.state.commandHistory, raw];

    if (!raw) return this._result();

    const tokens = this._tokenize(raw);
    if (tokens.length === 0) {
      return this._result();
    }

    const cmd = tokens[0];
    const args = tokens.slice(1);

    if (cmd === 'git') {
      const sub = args[0];
      const rest = args.slice(1);
      this._runGit(sub, rest);
    } else {
      this.state.output.push(`git: '${cmd}' не является командой git`);
      this.state.output.push('Введите «git help» для списка поддерживаемых команд.');
    }

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

  _result() {
    const out = this.state.output.join('\n');
    return {
      output: [...this.state.output],
      error: null,
      state: this._exportState(),
    };
  }

  _exportState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  _setError(msg) {
    this.state.output.push(`git: ${msg}`);
    this.state.lastError = msg;
  }

  _runGit(sub, args) {
    const handlers = {
      init: () => this._cmdInit(args),
      status: () => this._cmdStatus(args),
      config: () => this._cmdConfig(args),
      add: () => this._cmdAdd(args),
       commit: () => this._cmdCommit(args),
      log: () => this._cmdLog(args),
      diff: () => this._cmdDiff(args),
      restore: () => this._cmdRestore(args),
      edit: () => this._cmdEdit(args),
      branch: () => this._cmdBranch(args),
      checkout: () => this._cmdCheckout(args),
      switch: () => this._cmdSwitch(args),
      merge: () => this._cmdMerge(args),
      remote: () => this._cmdRemote(args),
      push: () => this._cmdPush(args),
      pull: () => this._cmdPull(args),
      fetch: () => this._cmdFetch(args),
      clone: () => this._cmdClone(args),
      reset: () => this._cmdReset(args),
      revert: () => this._cmdRevert(args),
      stash: () => this._cmdStash(args),
      help: () => this._cmdHelp(),
    };

    if (sub === undefined) {
      this._setError('не указана команда. Используйте git help');
      return;
    }

    const handler = handlers[sub];
    if (!handler) {
      this.state.output.push(`git: '${sub}' не поддерживается симулятором`);
      this.state.output.push('Поддерживаются: init, status, add, commit, log, diff, restore, edit, branch, checkout, switch, merge, remote, push, pull, fetch, clone, reset, revert, stash, help');
      return;
    }

    handler(args);
  }

  _cmdInit() {
    if (this.state.initialized) {
      this.state.output.push('Ужк к уже есть в этом каталоге.');
      return;
    }
    this.state.initialized = true;
    this.state.head = { type: 'branch', name: 'main' };
    this.state.branches = { main: null };
    this.state.output.push('Инициализирован пустой репозиторий Git в /repo');
  }

  _cmdStatus() {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }
    this.state.output.push(this._formatStatus());
  }

  _cmdConfig(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    if (args.length === 0 || args[0] !== 'user.name' && args[0] !== 'user.email') {
      this.state.output.push('[config]');
    } else if (args[0] === 'user.name' && args.length >= 3 && (args[1] === '"' || args[1] === '')) {
      const name = args.slice(2).join(' ').replace(/^"|"$/g, '');
      this.state.config['user.name'] = name;
      this.state.output.push(`[config] user.name = ${name}`);
    } else if (args[0] === 'user.name') {
      this.state.config['user.name'] = args[1] || 'student';
      this.state.output.push(`[config] user.name = ${args[1] || 'student'}`);
    }
  }

  _cmdAdd(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    if (args.length === 0 || args[0] === '.') {
      Object.assign(this.state.staged, this.state.working);
      this.state.output.push(`Добавлено: ${Object.keys(this.state.working).length} файлов`);
      return;
    }

    args.forEach(f => {
      if (f in this.state.working) {
        this.state.staged[f] = this.state.working[f];
      } else {
        this.state.staged[f] = '';
      }
    });
    this.state.output.push(`Добавлено в индекс: ${args.join(', ')}`);
  }

  _cmdCommit(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    const messageIdx = args.indexOf('-m');
    let message = '';
    if (messageIdx !== -1 && args[messageIdx + 1]) {
      message = args[messageIdx + 1];
    } else if (args.indexOf('--allow-empty') !== -1 && messageIdx === -1) {
      message = 'empty commit';
    }

    if (!message) {
      this.state.output.push('Сообщение коммита не указано. Используйте: git commit -m "сообщение"');
      return;
    }

    const isAmend = args.indexOf('--amend') !== -1;

    if (Object.keys(this.state.staged).length === 0 && args.indexOf('--allow-empty') === -1 && !isAmend) {
      this.state.output.push('Нечего коммитить. Используйте git add для добавления файлов.');
      return;
    }

    if (args.indexOf('--allow-empty') !== -1) {
      message = message || 'empty commit';
    }

    const hash = this._hash();
    const currentHash = this._currentCommit();

    const commit = {
      hash,
      message,
      parent: currentHash,
      author: this.state.config['user.name'] || 'student',
      timestamp: Date.now(),
    };

    if (isAmend && currentHash) {
      const lastCommit = this._getCommit(currentHash);
      if (lastCommit) {
        commit.files = { ...lastCommit.files, ...this.state.staged };
        commit.parent = lastCommit.parent;
        this.state.commits.pop();
      } else {
        commit.files = { ...this.state.staged };
      }
    } else {
      commit.files = { ...this.state.staged };
    }

    if (currentHash) {
      const parentCommit = this._getCommit(currentHash);
      if (parentCommit) {
        commit.parent2 = null;
      }
    }

    this.state.commits.push(commit);
    this.state.branches[this.state.head.name] = hash;
    this.state.staged = {};

    this.state.output.push(`[${this.state.head.name} ${hash}] ${message}`);
    this.state.output.push(`${Object.keys(commit.files).length} файлов изменено`);
  }

  _cmdEdit(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    if (args.length === 0) {
      this.state.output.push('Использование: git edit <filename> <content>');
      return;
    }

    const filename = args[0];
    const content = args.slice(1).join(' ');

    if (filename in this.state.working || filename in this.state.staged) {
      this.state.working[filename] = content;
      this.state.output.push(`Файл '${filename}' обновлён в рабочей директории`);
    } else {
      this.state.working[filename] = content;
      this.state.output.push(`Файл '${filename}' создан в рабочей директории`);
    }
  }

  _cmdLog(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    const oneline = args.includes('--oneline');
    const out = this._log(null, { oneline });
    if (out.length === 0) {
      this.state.output.push('Ещё нет коммитов');
    } else {
      this.state.output.push(...out);
    }
  }

  _cmdDiff(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    if (args.includes('--staged')) {
      this._diffStaged();
    } else {
      this._diffWorking();
    }
  }

  _diffWorking() {
    const lastHash = this._currentCommit();
    const lastCommit = lastHash ? this._getCommit(lastHash) : null;
    const files = new Set([...Object.keys(this.state.staged), ...Object.keys(this.state.working)]);
    let out = [];

    files.forEach(f => {
      const staged = this.state.staged[f];
      const working = this.state.working[f];
      if (staged !== working) {
        out.push(`diff --git a/${f} b/${f}`);
        out.push(`--- a/${f}`);
        out.push(`+++ b/${f}`);
        if (staged === undefined && working !== undefined) {
          out.push(`@@ -0,0 +1 @@`);
          out.push(`+${working}`);
        } else if (staged !== undefined && working === undefined) {
          out.push(`@@ -1 +0,0 @@`);
          out.push(`-${staged}`);
        } else if (staged !== undefined && working !== undefined) {
          out.push(`@@ -1 +1 @@`);
          out.push(`-${staged}`);
          out.push(`+${working}`);
        }
      }
    });

    if (out.length === 0) out.push('Рабочее дерево чистое');
    this.state.output.push(...out);
  }

  _diffStaged() {
    const lastHash = this._currentCommit();
    const lastCommit = lastHash ? this._getCommit(lastHash) : null;
    const files = Object.keys(this.state.staged);
    let out = [];

    files.forEach(f => {
      const staged = this.state.staged[f];
      const committed = lastCommit?.files[f];
      if (staged !== committed) {
        out.push(`diff --cached --git a/${f} b/${f}`);
        out.push(`--- a/${f}`);
        out.push(`+++ b/${f}`);
        if (committed === undefined) {
          out.push(`@@ -0,0 +1 @@`);
          out.push(`+${staged}`);
        } else {
          out.push(`@@ -1 +1 @@`);
          out.push(`-${committed}`);
          out.push(`+${staged}`);
        }
      }
    });

    if (out.length === 0) out.push('Нет изменений в индексе');
    this.state.output.push(...out);
  }

  _cmdRestore(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    if (args.includes('--staged') || args.includes('-S')) {
      args = args.filter(a => a !== '--staged' && a !== '-S');
      if (args.length === 0) {
        this._setError('укажите файл для восстановления из индекса');
        return;
      }
      const lastHash = this._currentCommit();
      const lastCommit = lastHash ? this._getCommit(lastHash) : null;
      args.forEach(f => {
        if (f in this.state.staged) {
          delete this.state.staged[f];
        }
        if (lastCommit && f in lastCommit.files) {
          this.state.staged[f] = lastCommit.files[f];
        }
      });
      this.state.output.push(`Восстановлено из индекса: ${args.join(', ')}`);
    } else {
      const lastHash = this._currentCommit();
      const lastCommit = lastHash ? this._getCommit(lastHash) : null;
      if (args.length === 0) {
        this._setError('укажите файл для восстановления');
        return;
      }
      args.forEach(f => {
        if (lastCommit && f in lastCommit.files) {
          this.state.working[f] = lastCommit.files[f];
        } else {
          delete this.state.working[f];
          delete this.state.staged[f];
        }
      });
      this.state.output.push(`Восстановлено: ${args.join(', ')}`);
    }
  }

  _cmdBranch(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    if (args.length === 0) {
      const current = this.state.head?.name || '';
      Object.entries(this.state.branches).forEach(([name, hash]) => {
        const marker = name === current ? '*' : ' ';
        const display = `  ${marker} ${name}`;
        this.state.output.push(display);
      });
      return;
    }

    if (args[0] === '-d' || args[0] === '-D') {
      const name = args[1];
      if (!name) {
        this._setError('укажите имя ветки для удаления');
        return;
      }
      if (name === this.state.head?.name) {
        this._setError(`нельзя удалить текущую ветку ${name}`);
        return;
      }
      if (!(name in this.state.branches)) {
        this.state.output.push(`Ветка ${name} не существует`);
        return;
      }
      delete this.state.branches[name];
      this.state.output.push(`Ветка ${name} удалена`);
      return;
    }

    const name = args[0];
    if (!name) return;
    if (name in this.state.branches) {
      this.state.output.push(`Ветка ${name} уже существует`);
      return;
    }
    const currentHash = this._currentCommit();
    this.state.branches[name] = currentHash;
    this.state.output.push(`Создана ветка ${name} на ${currentHash || 'начале'}`);
  }

  _cmdCheckout(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    if (args[0] === '-b') {
      const name = args[1];
      if (!name) {
        this._setError('укажите имя ветки');
        return;
      }
      if (name in this.state.branches) {
        this.state.output.push(`Ветка ${name} уже существует`);
        return;
      }
      const currentHash = this._currentCommit();
      this.state.branches[name] = currentHash;
      this.state.head = { type: 'branch', name };
      this.state.staged = {};

      const commit = currentHash ? this._getCommit(currentHash) : null;
      if (commit) {
        this.state.working = { ...commit.files };
      } else {
        this.state.working = {};
      }

      this.state.output.push(`Переключено на новую ветку ${name}`);
      return;
    }

    const name = args[0];
    if (!name) return;

    if (name in this.state.branches) {
      this.state.head = { type: 'branch', name };
      this.state.staged = {};

      const hash = this.state.branches[name];
      const commit = hash ? this._getCommit(hash) : null;
      if (commit) {
        this.state.working = { ...commit.files };
      } else {
        this.state.working = {};
      }

      this.state.output.push(`Переключено на ветку ${name}`);
    } else {
      const commit = this._getCommit(name);
      if (commit) {
        this.state.head = { type: 'commit', hash: name };
        this.state.staged = {};
        this.state.working = { ...commit.files };
        this.state.output.push(`Переключено на коммит ${name}`);
      } else {
        this.state.output.push(`Ветка или коммит ${name} не найден`);
      }
    }
  }

  _cmdSwitch(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    if (args[0] === '-c') {
      const name = args[1];
      if (!name) {
        this._setError('укажите имя ветки');
        return;
      }
      if (name in this.state.branches) {
        this.state.output.push(`Ветка ${name} уже существует`);
        return;
      }
      const currentHash = this._currentCommit();
      this.state.branches[name] = currentHash;
      this.state.head = { type: 'branch', name };
      this.state.staged = {};

      const commit = currentHash ? this._getCommit(currentHash) : null;
      if (commit) {
        this.state.working = { ...commit.files };
      } else {
        this.state.working = {};
      }

      this.state.output.push(`Создана и переключена на ветку ${name}`);
      return;
    }

    const name = args[0];
    if (!name) {
      this._setError('укажите имя ветки');
      return;
    }

    if (name in this.state.branches) {
      this.state.head = { type: 'branch', name };
      this.state.staged = {};

      const hash = this.state.branches[name];
      const commit = hash ? this._getCommit(hash) : null;
      if (commit) {
        this.state.working = { ...commit.files };
      } else {
        this.state.working = {};
      }

      this.state.output.push(`Переключено на ветку ${name}`);
    } else {
      this.state.output.push(`Ветка ${name} не найдена`);
    }
  }

  _cmdMerge(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    const name = args[0];
    if (!name || !(name in this.state.branches)) {
      this.state.output.push(`Ветка ${name} не найдена`);
      return;
    }

    const currentHash = this._currentCommit();
    const targetHash = this.state.branches[name];

    if (!currentHash) {
      this.state.output.push('Нечего сливать. Создайте коммит.');
      return;
    }

    const current = this._getCommit(currentHash);
    const target = targetHash ? this._getCommit(targetHash) : null;

    const targetIsAncestor = this._isAncestor(currentHash, targetHash);
    if (targetIsAncestor) {
      this.state.branches[this.state.head.name] = targetHash;
      this.state.staged = { ...target.files };
      this.state.working = { ...target.files };
      this.state.output.push(`Слияние main и ${name}`);
      this.state.output.push(`${this._countDiverged(currentHash, targetHash)} файлов изменено`);
      return;
    }

    const conflict = this._hasConflict(current, target);
    if (conflict.hasConflict) {
      Object.entries(conflict.conflictFiles).forEach(([f, content]) => {
        this.state.working[f] = content;
      });
      this.state.output.push(`Автоматическое слияние завершилось ошибкой; простое разрешение конфликтов невозможно.`);
      this.state.output.push(``);

      const hash = this._hash();
      const mergeCommit = {
        hash,
        message: `Merge branch '${name}'`,
        parent: currentHash,
        parent2: targetHash,
        files: { ...this.state.working },
        author: this.state.config['user.name'] || 'student',
        timestamp: Date.now(),
      };
      this.state.commits.push(mergeCommit);
      this.state.branches[this.state.head.name] = hash;
      this.state.staged = {};

      this.state.output.push(`Создан merge-commit ${hash}`);
      this.state.output.push('');
      this.state.output.push('Разрешите конфликты и сделайте коммит.');
      return;
    }

    const mergeFiles = { ...current.files };
    Object.entries(target.files).forEach(([f, content]) => {
      mergeFiles[f] = content;
    });

    const hash = this._hash();
    const mergeCommit = {
      hash,
      message: `Merge branch '${name}'`,
      parent: currentHash,
      parent2: targetHash,
      files: mergeFiles,
      author: this.state.config['user.name'] || 'student',
      timestamp: Date.now(),
    };

    this.state.commits.push(mergeCommit);
    this.state.branches[this.state.head.name] = hash;
    this.state.staged = { ...mergeFiles };
    this.state.working = { ...mergeFiles };

    this.state.output.push(`Слияние ветки ${name} выполнено`);
    this.state.output.push(`${Object.keys(mergeFiles).length} файлов обновлено`);
  }

  _isAncestor(ancestorHash, descHash) {
    if (!descHash) return true;
    let current = descHash;
    const visited = new Set();
    while (current && !visited.has(current)) {
      if (current === ancestorHash) return true;
      visited.add(current);
      const commit = this._getCommit(current);
      if (!commit) break;
      current = commit.parent;
    }
    return false;
  }

  _hasConflict(current, target) {
    const conflictFiles = {};
    let hasConflict = false;

    const currentFiles = current ? Object.keys(current.files) : [];
    const targetFiles = target ? Object.keys(target.files) : [];

    const allFiles = new Set([...currentFiles, ...targetFiles]);

    allFiles.forEach(f => {
      const cContent = current?.files[f];
      const tContent = target?.files[f];

      if (cContent && tContent && cContent !== tContent) {
        conflictFiles[f] = `<<<<<<< HEAD\n${cContent}\n=======\n${tContent}\n>>>>>>>`;
        hasConflict = true;
      }
    });

    return { hasConflict, conflictFiles };
  }

  _countDiverged(baseHash, targetHash) {
    const base = this._getCommit(baseHash);
    const target = this._getCommit(targetHash);
    if (!base || !target) return 0;

    const baseFiles = base.files;
    const targetFiles = target.files;
    let count = 0;

    Object.keys(targetFiles).forEach(f => {
      if (baseFiles[f] !== targetFiles[f]) count++;
    });

    return count;
  }

  _cmdRemote(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    if (args[0] === 'add') {
      const name = args[1];
      const url = args[2];
      if (!name || !url) {
        this._setError('usage: git remote add <name> <url>');
        return;
      }
      this.state.remote[name] = { url, branches: {} };
      this.state.output.push(`Добавлён remote ${name}: ${url}`);
    } else if (args[0] === 'remove') {
      const name = args[1];
      if (name && this.state.remote[name]) {
        delete this.state.remote[name];
        this.state.output.push(`Remote ${name} удалён`);
      }
    } else if (!args[0] || args[0] === 'show' || args[0] === 'list' || args[0] === '-v') {
      const remotes = Object.keys(this.state.remote).filter(k => k !== 'origin' || this.state.remote[k].url !== null);
      if (remotes.length === 0) {
        this.state.output.push('(нет remote)');
      } else {
        remotes.forEach(name => {
          const r = this.state.remote[name];
          if (r.url) this.state.output.push(`${name}\t${r.url} (fetch)`);
        });
      }
    } else {
      this.state.output.push(`git remote: неизвестная подкоманда ${args[0]}`);
    }
  }

  _cmdPush(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    const remote = args[0] || 'origin';
    const branch = args[1] || this.state.head?.name;

    if (!this.state.remote[remote] || !this.state.remote[remote].url) {
      this.state.output.push(`remote ${remote} не найден`);
      return;
    }

    if (!branch || !(branch in this.state.branches)) {
      this.state.output.push(`ветка ${branch} не найдена`);
      return;
    }

    const hash = this.state.branches[branch];
    this.state.remote[remote].branches[branch] = hash;
    this.state.output.push(`Опубликована ветка ${branch} в ${remote}`);
    this.state.output.push(`  -> ${this.state.remote[remote].url}`);
  }

  _cmdPull(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    const remote = args[0] || 'origin';
    const branch = args[1] || this.state.head?.name;

    if (!this.state.remote[remote] || !this.state.remote[remote].url) {
      this.state.output.push(`remote ${remote} не найден`);
      return;
    }

    const remoteHash = this.state.remote[remote].branches[branch];
    if (!remoteHash) {
      this.state.output.push(`ветка ${branch} в remote пуста`);
      return;
    }

    const remoteCommit = this._getCommit(remoteHash);
    if (remoteCommit) {
      this.state.branches[branch] = remoteHash;
      this.state.head = { type: 'branch', name: branch };
      this.state.staged = {};
      this.state.working = { ...remoteCommit.files };
    }

    this.state.output.push(`Извлечено из ${remote} и объединено с ${branch}`);
  }

  _cmdFetch(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    const remote = args[0] || 'origin';
    if (!this.state.remote[remote]) {
      this.state.output.push(`remote ${remote} не найден`);
      return;
    }

    this.state.output.push(`Извлечение из ${remote}`);
    this.state.output.push(`  -> ${this.state.remote[remote].url || 'unknown'}`);
  }

  _cmdClone(args) {
    const url = args[0];
    if (!url) {
      this._setError('usage: git clone <url>');
      return;
    }

    this.state.initialized = true;
    this.state.head = { type: 'branch', name: 'main' };
    this.state.branches = { main: null };
    this.state.remote.origin = { url, branches: {} };
    this.state.output.push(`Клонирование из ${url}`);
    this.state.output.push(`Репозиторий успешно клонирован`);
  }

  _cmdReset(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    let mode = 'mixed';
    let target = 'HEAD';

    args.forEach(a => {
      if (a === '--soft') mode = 'soft';
      else if (a === '--hard') mode = 'hard';
      else if (a === '--mixed') mode = 'mixed';
      else if (!a.startsWith('--')) target = a;
    });

    let targetHash;
    if (target === 'HEAD') {
      targetHash = this._currentCommit();
    } else if (target === 'HEAD~1' || target === 'HEAD~') {
      const current = this._currentCommit();
      const commit = this._getCommit(current);
      targetHash = commit?.parent;
    } else {
      targetHash = target;
    }

    if (!targetHash || !this._getCommit(targetHash)) {
      this.state.output.push(`Коммит ${target} не найден`);
      return;
    }

    const targetCommit = this._getCommit(targetHash);

    if (mode === 'soft') {
      if (this.state.head.type === 'branch') {
        this.state.branches[this.state.head.name] = targetHash;
      }
      this.state.output.push(`Сброс (--soft) до ${targetHash}`);
      this.state.output.push('Изменения сохранены в индексе для коммита');
    } else if (mode === 'mixed') {
      if (this.state.head.type === 'branch') {
        this.state.branches[this.state.head.name] = targetHash;
      }
      this.state.staged = {};
      this.state.working = { ...targetCommit.files };
      this.state.output.push(`Сброс (--mixed) до ${targetHash}`);
      this.state.output.push('Изменения восстановлены в рабочем каталоге');
    } else if (mode === 'hard') {
      if (this.state.head.type === 'branch') {
        this.state.branches[this.state.head.name] = targetHash;
      }
      this.state.staged = {};
      this.state.working = { ...targetCommit.files };
      this.state.output.push(`Сброс (--hard) до ${targetHash}`);
      this.state.output.push('Все изменения удалены');
    }
  }

  _cmdRevert(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    let target = args[0];
    if (!target) {
      this._setError('укажите хеш коммита для отмены');
      return;
    }

    if (target === 'HEAD') {
      target = this._currentCommit();
    }

    const commit = this._getCommit(target);
    if (!commit) {
      this.state.output.push(`Коммит ${target} не найден`);
      return;
    }

    if (!this.state.head || !this._currentCommit()) {
      this.state.output.push('Нечего отменять');
      return;
    }

    const newFiles = {};
    const parent = commit.parent ? this._getCommit(commit.parent) : null;
    if (parent) {
      Object.keys(parent.files).forEach(f => {
        newFiles[f] = parent.files[f];
      });
    }

    const hash = this._hash();
    const revertCommit = {
      hash,
      message: `Revert "${commit.message}"`,
      parent: this._currentCommit(),
      files: newFiles,
      author: this.state.config['user.name'] || 'student',
      timestamp: Date.now(),
    };

    this.state.commits.push(revertCommit);
    if (this.state.head.type === 'branch') {
      this.state.branches[this.state.head.name] = hash;
    }
    this.state.staged = {};
    this.state.working = { ...newFiles };

    this.state.output.push(`Создан revert-commit ${hash}`);
  }

  _cmdStash(args) {
    if (!this.state.initialized) {
      this._setError('не является репозиторием Git');
      return;
    }

    if (args.length === 0 || args[0] === undefined) {
      if (Object.keys(this.state.staged).length > 0 || Object.keys(this.state.working).length > 0) {
        const snapshot = {
          staged: { ...this.state.staged },
          working: { ...this.state.working },
          message: `stash@{${this.state.stash.length}}`,
          timestamp: Date.now(),
        };
        this.state.stash.push(snapshot);
        this.state.staged = {};
        this.state.output.push('Сохранено в stash');
      } else {
        this.state.output.push('Нечего сохранять');
      }
      return;
    }

    if (args[0] === 'pop') {
      if (this.state.stash.length === 0) {
        this.state.output.push('Нет сохранённых изменений');
        return;
      }
      const snapshot = this.state.stash.pop();
      this.state.staged = { ...snapshot.staged };
      this.state.working = { ...snapshot.working };
      this.state.output.push('Восстановлено из stash');
      return;
    }

    if (args[0] === 'list') {
      if (this.state.stash.length === 0) {
        this.state.output.push('Нет сохранённых изменений');
      } else {
        this.state.stash.forEach((s, i) => {
          this.state.output.push(`stash@{${i}}: ${s.message}`);
        });
      }
      return;
    }

    this.state.output.push('git stash: неизвестная опция. Используйте: git stash, git stash pop, git stash list');
  }

  _cmdHelp() {
    const cmds = [
      'Инициализация:',
      '  git init              - создать репозиторий',
      '  git config user.name X - установить имя пользователя',
      '  git status            - статус репозитория',
      '',
      'Работа с файлами:',
      '  git add <file>|.       - добавить в индекс',
      '  git edit <file> <text>  - изменить файл в working',
      '  git restore <file>      - отменить изменения в working',
      '  git restore --staged   - убрать из индекса',
      '',
      'Коммиты:',
      '  git commit -m "msg"    - создать коммит',
      '  git log [--oneline]    - журнал коммитов',
      '  git diff               - изменения в working',
      '  git diff --staged      - изменения в индексе',
      '',
      'Ветки:',
      '  git branch             - список веток',
      '  git branch <name>      - создать ветку',
      '  git branch -d <name>   - удалить ветку',
      '  git checkout <name>    - переключиться',
      '  git checkout -b <name> - создать и переключиться',
      '  git switch <name>      - переключиться',
      '  git switch -c <name>   - создать и переключиться',
      '  git merge <branch>     - слить ветку',
      '',
      'Удалёнка:',
      '  git remote add <name> <url>',
      '  git push <remote> <branch>',
      '  git pull <remote> <branch>',
      '  git fetch <remote>',
      '  git clone <url>',
      '',
      'Откат:',
      '  git reset [--soft|--hard|--mixed] <commit>',
      '  git revert <commit>',
      '  git stash / git stash pop / git stash list',
    ];
    this.state.output.push(...cmds);
  }
}

