/* Visual extras built from the page's own data: skill radar (from the CV + site evidence), coloured tech tags. */
(() => {
  const COLORS = { javascript: '#f7df1e', react: '#61dafb', 'node.js': '#7cc36e', node: '#7cc36e', mongodb: '#47a248', python: '#4b8bbe', pandas: '#b794f6', matplotlib: '#f59e0b', numpy: '#4dabcf', html: '#e34f26', css: '#2965f1', java: '#f89820', git: '#f05032', github: '#9aa4b5', sql: '#00a3b8', c: '#7c9cff', 'c++': '#659ad2', physics: '#fbbf24', 'data analysis': '#2dd4bf', 'numerical logic': '#a78bfa', express: '#9aa4b5', latex: '#35a853', scipy: '#3b82f6' };
  document.querySelectorAll('.tech-tags span, .skilltags span').forEach((el) => {
    const k = el.textContent.trim().toLowerCase().replace(/\.js$/, (m) => m); const c = COLORS[k] || COLORS[k.split(/[\s/]/)[0]];
    if (c) { el.classList.add('has-dot'); el.style.setProperty('--dot', c); }
  });

  const host = document.querySelector('#skills .skillgrid'); const api = window.CareerLab;
  if (!host || !api || !api.taxonomy) return;
  const NS = 'http://www.w3.org/2000/svg', mk = (t, a = {}, txt) => { const e = document.createElementNS(NS, t); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); if (txt) e.textContent = txt; return e; };
  api.getBaseline().then((base) => {
    const catOf = new Map(api.taxonomy.filter((r) => r.weight >= 1).map((r) => [r.name, r.category]));
    const ev = {}, li = {};
    base.skills.forEach((v, name) => { const c = catOf.get(name); if (!c) return; if (v.strength >= 2) ev[c] = (ev[c] || 0) + 1; else if (v.strength === 1) li[c] = (li[c] || 0) + 1; });
    const cats = [...new Set([...Object.keys(ev), ...Object.keys(li)])]; if (cats.length < 3) return;
    const tot = (c) => (ev[c] || 0) + (li[c] || 0), max = Math.max(...cats.map(tot));
    const S = 380, C = S / 2, R = 128, ang = (i) => (Math.PI * 2 * i) / cats.length - Math.PI / 2;
    const pt = (i, f) => [C + Math.cos(ang(i)) * R * f, C + Math.sin(ang(i)) * R * f];
    const poly = (f) => cats.map((c, i) => pt(i, f(c)).map((n) => n.toFixed(1)).join(',')).join(' ');
    const svg = mk('svg', { viewBox: `0 0 ${S} ${S}`, role: 'img', 'aria-label': 'Radar chart of skill areas: outer shape is everything listed, inner shape is skills shown in projects or experience' });
    [0.33, 0.66, 1].forEach((f) => svg.append(mk('polygon', { points: poly(() => f), class: 'rd-ring' })));
    cats.forEach((c, i) => { const [x, y] = pt(i, 1); svg.append(mk('line', { x1: C, y1: C, x2: x, y2: y, class: 'rd-axis' })); const [lx, ly] = pt(i, 1.2); svg.append(mk('text', { x: lx, y: ly, class: 'rd-label', 'text-anchor': Math.abs(lx - C) < 8 ? 'middle' : lx > C ? 'start' : 'end', 'dominant-baseline': 'middle' }, c)); });
    svg.append(mk('polygon', { points: poly((c) => tot(c) / max), class: 'rd-all' }), mk('polygon', { points: poly((c) => (ev[c] || 0) / max), class: 'rd-ev' }));
    cats.forEach((c, i) => { const [x, y] = pt(i, (ev[c] || 0) / max); svg.append(mk('circle', { cx: x, cy: y, r: 3.5, class: 'rd-dot' })); });
    const box = document.createElement('div'); box.className = 'skill-radar';
    const side = document.createElement('div'); side.className = 'rd-side';
    side.innerHTML = '<h3>Where my skills are strongest</h3><p>Built from this site and my CV. It compares my own areas with each other; it is not a rating against anyone else.</p><ul class="rd-legend"><li><i class="k-ev"></i>Shown in a project, role or credential</li><li><i class="k-all"></i>Listed in skills or CV</li></ul>';
    const list = document.createElement('ul'); list.className = 'rd-counts'; cats.sort((a, b) => tot(b) - tot(a)).forEach((c) => { const l = document.createElement('li'); l.textContent = `${c}: ${ev[c] || 0} shown, ${tot(c)} listed`; list.append(l); }); side.append(list);
    box.append(svg, side); host.before(box);
  }).catch(() => {});
})();

/* Reading progress bar + back-to-top button */
(() => {
  const bar = document.querySelector('.scroll-progress i'); const top = document.createElement('button');
  top.type = 'button'; top.className = 'to-top'; top.setAttribute('aria-label', 'Back to top'); top.textContent = '↑'; document.body.append(top);
  top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  let tick = false;
  const update = () => { tick = false; const h = document.documentElement.scrollHeight - innerHeight, y = scrollY; if (bar) bar.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`; top.classList.toggle('show', y > 900); };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true }); update();
})();
