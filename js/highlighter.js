/**
 * Минимальный highlighter для Praxis Learn.
 * Поддерживает: python, bash, yaml, dockerfile.
 * Экспортирует highlightAll() для разметки всех <pre class="language-*">.
 */
(function () {
  'use strict';

  var TOKENS = {
    python: [
      { name: 'comment',  regex: /#[^\n]*/g },
      { name: 'string',   regex: /(["'`])(?:\\.|(?!\1)[^\\\n])*?\1/g },
      { name: 'keyword',  regex: /\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/g },
      { name: 'builtin',  regex: /\b(?:print|len|type|int|float|str|bool|list|dict|set|tuple|range|open|input|abs|round|sum|min|max|sorted|enumerate|zip|map|filter|super|isinstance|issubclass)\b/g },
      { name: 'boolean',  regex: /\b(?:True|False|None)\b/g },
      { name: 'number',   regex: /(?<![.\w])(\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g },
      { name: 'operator', regex: /[-+*/%@=<>!&|^~]+|\*\*/g },
      { name: 'punctuation', regex: /[{}[\](),.:]/g }
    ],
    bash: [
      { name: 'comment',  regex: /#[^\n]*/g },
      { name: 'string',   regex: /(["'`])(?:\\.|(?!\1)[^\\\n])*?\1/g },
      { name: 'keyword',  regex: /\b(?:if|then|else|fi|for|do|done|while|case|esac|in|function|local|echo|return|exit|export|set|unset|true|false)\b/g },
      { name: 'builtin',  regex: /\b(?:bash|sh|echo|cat|ls|cd|cp|mv|rm|grep|sed|awk|git|docker|pip|python|node|npm)\b/g },
      { name: 'number',   regex: /\b\d+\b/g },
      { name: 'operator', regex: /[-+*/=<>!&|;]/g }
    ],
    yaml: [
      { name: 'comment',  regex: /#[^\n]*/g },
      { name: 'string',   regex: /(["'`])(?:\\.|(?!\1)[^\\\n])*?\1/g },
      { name: 'keyword',  regex: /\b(?:true|false|null|yes|no|~)\b/g },
      { name: 'number',   regex: /(?<=:\s)(-?\d+(?:\.\d+)?)\b/g },
      { name: 'operator', regex: /[:\-]/g }
    ],
    dockerfile: [
      { name: 'comment',  regex: /#[^\n]*/g },
      { name: 'string',   regex: /(["'`])(?:\\.|(?!\1)[^\\\n])*?\1/g },
      { name: 'keyword',  regex: /\b(?:FROM|RUN|CMD|LABEL|MAINTAINER|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/g },
      { name: 'builtin',  regex: /\b(?:apt|apt-get|pip|npm|yarn|apk|yum|dnf|wget|curl|bash|sh)\b/g },
      { name: 'number',   regex: /\b\d+\b/g },
      { name: 'operator', regex: /[=&|]/g }
    ]
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlight(code, lang) {
    var patterns = TOKENS[lang] || TOKENS.python;
    var matches = [];

    for (var i = 0; i < patterns.length; i++) {
      var p = patterns[i];
      p.regex.lastIndex = 0;
      var m;
      while ((m = p.regex.exec(code)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, text: m[0], token: p.name });
        if (m.index === p.regex.lastIndex) p.regex.lastIndex++;
      }
    }

    matches.sort(function (a, b) { return a.start - b.start; });

    var result = '';
    var pos = 0;
    for (var j = 0; j < matches.length; j++) {
      var tok = matches[j];
      if (tok.start < pos) continue;
      if (tok.start > pos) {
        result += escapeHtml(code.substring(pos, tok.start));
      }
      result += '<span class="token ' + tok.token + '">' + escapeHtml(tok.text) + '</span>';
      pos = tok.end;
    }
    if (pos < code.length) {
      result += escapeHtml(code.substring(pos));
    }

    return result;
  }

  function highlightAll() {
    var blocks = document.querySelectorAll('pre code[class*="language-"]');
    blocks.forEach(function (block) {
      var lang = block.className.match(/language-(\w+)/);
      lang = lang ? lang[1] : 'python';
      block.innerHTML = highlight(block.textContent, lang);
    });
  }

  window.PraxisHighlighter = {
    highlight: highlight,
    highlightAll: highlightAll
  };
})();
