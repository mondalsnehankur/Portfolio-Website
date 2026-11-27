/* Runs the CLMS Python project in the browser with Pyodide. See clms/runner.py for how input() is handled. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  const FILES = ['main', 'utilities', 'user', 'student', 'faculty', 'administrator', 'course', 'academic'];
  const DATA = ['users.json', 'courses.json', 'academic_records.json'];
  const KEY = 'clms-demo-';

  /* theme */
  const root = document.documentElement, themeBtn = $('theme-toggle');
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* blocked */ } }, del: (k) => { try { localStorage.removeItem(k); } catch (_) { /* blocked */ } } };
  const setTheme = (t) => { root.dataset.theme = t; themeBtn.textContent = t === 'light' ? '☾' : '☼'; themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark mode' : 'Switch to light mode'); };
  const st = store.get('portfolio-theme');
  setTheme(st === 'light' || st === 'dark' ? st : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  themeBtn.addEventListener('click', () => { const n = root.dataset.theme === 'light' ? 'dark' : 'light'; setTheme(n); store.set('portfolio-theme', n); });

  const out = $('clms-out'), term = $('clms-term'), line = $('clms-line'), prompt = $('clms-prompt'), inp = $('clms-in'), status = $('clms-status');
  const startBtn = $('clms-start'), restartBtn = $('clms-restart'), resetBtn = $('clms-reset'), hints = $('clms-hints');
  const say = (t) => { status.textContent = t; };
  const scroll = () => { term.scrollTop = term.scrollHeight; };
  const write = (s) => { out.append(document.createTextNode(s)); scroll(); };

  /* source viewer + sources for the runner */
  const sources = {};
  const srcFetch = Promise.all(FILES.map((n) => fetch('clms/py/' + n + '.py').then((r) => { if (!r.ok) throw new Error(n); return r.text(); }).then((t) => { sources[n] = t; })));
  const sel = $('clms-file'); FILES.forEach((n) => { const o = document.createElement('option'); o.value = n; o.textContent = n + '.py'; sel.append(o); });
  const showSrc = () => { $('clms-src').textContent = sources[sel.value] || ''; };
  srcFetch.then(showSrc).catch(() => { $('clms-src').textContent = 'Could not load the source files here. They are in the GitHub repository.'; });
  sel.addEventListener('change', showSrc);

  let py = null, gen = 0, waiting = null;

  const loadPy = async () => {
    if (py) return py;
    say('Loading Python… this takes a few seconds the first time.');
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = PYODIDE + 'pyodide.js'; s.onload = res; s.onerror = () => rej(new Error('Could not download Pyodide.')); document.head.append(s); });
    py = await window.loadPyodide({ indexURL: PYODIDE });
    const runner = await (await fetch('clms/runner.py')).text();
    py.FS.mkdirTree('/clms'); py.FS.chdir('/clms');
    py.runPython(runner);
    return py;
  };

  const restoreData = () => { DATA.forEach((f) => { const v = store.get(KEY + f); try { py.FS.unlink('/clms/' + f); } catch (_) { /* none yet */ } if (v) py.FS.writeFile('/clms/' + f, v); }); };
  const saveData = () => { DATA.forEach((f) => { try { if (py.FS.analyzePath('/clms/' + f).exists) store.set(KEY + f, py.FS.readFile('/clms/' + f, { encoding: 'utf8' })); } catch (_) { /* skip */ } }); };

  const run = async () => {
    const my = ++gen;
    waiting = null; out.textContent = ''; line.hidden = true;
    startBtn.hidden = true; restartBtn.hidden = false; resetBtn.hidden = false; hints.hidden = false;
    try {
      await srcFetch; await loadPy();
      if (my !== gen) return;
      restoreData();
      say('Running. Type in the terminal and press Enter.');
      const jsWrite = (s) => { if (my === gen) write(s); };
      const jsRead = (p) => new Promise((resolve) => {
        saveData();
        if (my !== gen) return; /* an older run: leave it suspended forever */
        const secret = /password/i.test(p);
        prompt.textContent = p; inp.type = secret ? 'password' : 'text'; inp.value = ''; line.hidden = false; scroll();
        inp.focus({ preventScroll: true });
        waiting = (v) => { waiting = null; line.hidden = true; write(p + (secret ? '•'.repeat(v.length) : v) + '\n'); resolve(v); };
      });
      const runner = py.globals.get('run');
      await runner(py.toPy(sources), jsWrite, jsRead);
      if (my !== gen) return;
      saveData(); line.hidden = true; say('The program has finished. Press Restart to run it again.');
    } catch (e) {
      if (my !== gen) return;
      write('\n[page error] ' + (e && e.message ? e.message : e) + '\n');
      say('Something went wrong. Check your connection and press Restart.');
      startBtn.hidden = false; startBtn.textContent = 'Try again'; restartBtn.hidden = true;
    }
  };

  line.addEventListener('submit', (ev) => { ev.preventDefault(); if (waiting) waiting(inp.value); });
  startBtn.addEventListener('click', run);
  restartBtn.addEventListener('click', run);
  resetBtn.addEventListener('click', () => { DATA.forEach((f) => store.del(KEY + f)); say('Demo data cleared. Restarting with a fresh system.'); run(); });
  hints.addEventListener('click', (ev) => { const b = ev.target.closest('button[data-fill]'); if (!b || line.hidden) return; inp.value = b.dataset.fill; inp.focus(); });
  term.addEventListener('click', () => { if (!line.hidden && !getSelection().toString()) inp.focus({ preventScroll: true }); });
})();
