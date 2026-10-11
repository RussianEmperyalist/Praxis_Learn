let pyodidePromise = null;

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

export async function initPyodide(onStatus) {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    onStatus?.('Загрузка Pyodide...');
    const py = await window.loadPyodide({ indexURL: PYODIDE_URL });
    onStatus?.('Инициализация окружения...');
    await py.runPythonAsync(`
import sys, io
_buf_out = io.StringIO()
_buf_err = io.StringIO()
`);
    onStatus?.('Готово');
    return py;
  })();

  return pyodidePromise;
}

export async function runPython(code, { timeoutMs = 10000 } = {}) {
  const py = await initPyodide();

  const escaped = JSON.stringify(code);

  const wrapped = `
import sys, io
_buf_out = io.StringIO()
_buf_err = io.StringIO()
_old_out, _old_err = sys.stdout, sys.stderr
sys.stdout, stderr = _buf_out, _buf_err
try:
    _ns = {'__name__': '__main__'}
    exec(compile(${escaped}, '<lesson>', 'exec'), _ns)
except BaseException:
    import traceback
    traceback.print_exc(file=_buf_err)
finally:
    sys.stdout, sys.stderr = _old_out, _old_err
_var_info = {}
for _k, _v in _ns.items():
    if not _k.startswith('_'):
        _var_info[_k] = {'type': type(_v).__name__, 'repr': repr(_v)}
_result = {'stdout': _buf_out.getvalue(), 'stderr': _buf_err.getvalue(), 'var_info': _var_info}
`;

  const result = await Promise.race([
    py.runPythonAsync(wrapped).then(() => py.globals.get('_result')),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Превышен лимит времени выполнения')), timeoutMs)),
  ]);

  const { stdout, stderr, var_info } = result.toJs ? result.toJs() : result;
  return { stdout: stdout || '', stderr: stderr || '', var_info: var_info || {} };
}
