/**
 * Amber Learn — JS Runner (sandbox через iframe).
 * Запускает код пользователя в изолированном iframe и собирает
 * console.log / ошибки / переменные через postMessage.
 */

export async function runJS(code) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const timeout = setTimeout(() => {
      resolve({ stdout: '', stderr: 'Превышен таймаут (5 сек)', vars: {} });
      iframe.remove();
    }, 5000);

    let collectedOutput = '';
    let collectedError = '';

    const listener = (e) => {
      if (e.source !== iframe.contentWindow) return;
      if (e.data.type === 'stdout') collectedOutput += e.data.text + '\n';
      if (e.data.type === 'stderr') collectedError += e.data.text;
      if (e.data.type === 'done') {
        clearTimeout(timeout);
        window.removeEventListener('message', listener);
        resolve({ stdout: collectedOutput, stderr: collectedError, vars: e.data.vars || {} });
        iframe.remove();
      }
    };

    window.addEventListener('message', listener);

    const escaped = code.replace(/<\/script>/gi, '<\\/script>');

    iframe.srcdoc = `
      <script>
        const _origLog = console.log;
        console.log = (...args) => {
          const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
          parent.postMessage({ type: 'stdout', text: msg }, '*');
        };
        try {
          (async () => {
            ${escaped}
          })();
        } catch (e) {
          parent.postMessage({ type: 'stderr', text: e.toString() }, '*');
          parent.postMessage({ type: 'done', vars: {} }, '*');
        }
        const vars = {};
        for (const k in window) {
          if (['top','parent','self','window','document','console'].includes(k)) continue;
          try {
            const v = window[k];
            if (['number','string','boolean'].includes(typeof v)) vars[k] = v;
            else if (Array.isArray(v) || (v && typeof v === 'object')) vars[k] = JSON.stringify(v);
          } catch(_) {}
        }
        parent.postMessage({ type: 'done', vars }, '*');
      <\/script>
    `;
  });
}
