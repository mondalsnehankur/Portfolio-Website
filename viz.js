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

/* Tools marquee: loops right to left, pauses on hover or focus, static when motion is reduced */
(() => {
  const m = document.querySelector('.marquee'); if (!m) return;
  const track = m.querySelector('.marquee-track'), items = [...track.children];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { m.classList.add('is-static'); return; }
  let timer;
  const build = () => {
    track.querySelectorAll('[data-clone]').forEach((n) => n.remove()); m.classList.remove('is-ready');
    const gap = parseFloat(getComputedStyle(items[0]).marginRight) || 0, setW = items.reduce((w, e) => w + e.offsetWidth + gap, 0);
    if (!setW) return;
    const copies = Math.ceil(m.clientWidth / setW) + 1;
    for (let c = 0; c < copies; c++) items.forEach((el) => { const k = el.cloneNode(true); k.setAttribute('aria-hidden', 'true'); k.dataset.clone = '1'; track.append(k); });
    track.style.setProperty('--shift', `-${setW}px`); track.style.setProperty('--dur', `${Math.round(setW / 55)}s`); m.classList.add('is-ready');
  };
  const start = () => requestAnimationFrame(build);
  if (document.readyState === 'complete') start(); else addEventListener('load', start);
  addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(build, 250); });
})();

/* Horizontal scroll rows (ebooks, notes): arrows appear only when there is more to see */
(() => {
  document.querySelectorAll('[data-hscroll]').forEach((track) => {
    const wrap = document.createElement('div'); wrap.className = 'hscroll'; track.before(wrap); wrap.append(track);
    track.tabIndex = 0; track.setAttribute('role', 'region');
    const mk = (dir, label, glyph) => { const b = document.createElement('button'); b.type = 'button'; b.className = `hs-btn ${dir}`; b.setAttribute('aria-label', label); b.textContent = glyph; wrap.append(b); return b; };
    const prev = mk('prev', 'Scroll left', '←'), next = mk('next', 'Scroll right', '→');
    const step = () => Math.max(260, track.clientWidth * 0.8), smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: smooth() })); next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: smooth() }));
    const update = () => { const max = track.scrollWidth - track.clientWidth; prev.hidden = track.scrollLeft < 8; next.hidden = max < 8 || track.scrollLeft > max - 8; };
    track.addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); new ResizeObserver(update).observe(track); update();
  });
})();

/* Hover / focus photo preview on achievement cards */
(() => {
  const cards = document.querySelectorAll('.has-preview[data-preview]'); if (!cards.length) return;
  const touch = matchMedia('(hover: none)').matches, exts = ['webp', 'png', 'jpg', 'jpeg'];
  const probe = (base, i, list) => new Promise((res) => { let k = 0; const img = new Image(); const next = () => { if (k >= list.length) return res(null); img.src = `${base}-${i}.${list[k++]}`; }; img.onload = () => res(img.src); img.onerror = next; next(); });
  cards.forEach(async (card) => {
    const base = card.dataset.preview, n = +card.dataset.previewCount || 3, list = card.dataset.previewExt ? [card.dataset.previewExt] : exts;
    const found = (await Promise.all(Array.from({ length: n }, (_, i) => probe(base, i + 1, list)))).filter(Boolean);
    if (!found.length) { card.classList.remove('has-preview'); return; }
    const pop = document.createElement('div'); pop.className = 'hover-preview'; pop.setAttribute('role', 'tooltip');
    const grid = document.createElement('div'); grid.className = `hp-grid n${Math.min(found.length, 3)}`;
    found.slice(0, 3).forEach((src, i) => { const f = document.createElement('div'); const im = document.createElement('img'); im.src = src; im.alt = ''; im.loading = 'lazy'; f.append(im); if (i === 2 && found.length > 3) { const more = document.createElement('span'); more.textContent = `+${found.length - 3}`; f.append(more); } grid.append(f); });
    pop.append(grid); const cap = document.createElement('p'); cap.textContent = card.dataset.previewHint || 'Photos from the event'; pop.append(cap); card.append(pop);
    const hint = document.createElement('p'); hint.className = 'hp-hint'; hint.textContent = touch ? 'Tap the card to preview photos' : 'Hover to preview photos'; card.querySelector('div')?.append(hint);
    let t; const show = () => { clearTimeout(t); const r = card.getBoundingClientRect(); pop.classList.toggle('align-right', r.left + 470 > innerWidth - 16); card.classList.add('is-previewing'); };
    const hide = () => { t = setTimeout(() => card.classList.remove('is-previewing'), 140); };
    if (!touch) { card.addEventListener('mouseenter', show); card.addEventListener('mouseleave', hide); }
    card.addEventListener('focusin', show); card.addEventListener('focusout', hide);
    if (touch) card.addEventListener('click', (e) => { if (e.target.closest('button')) return; card.classList.toggle('is-previewing'); if (card.classList.contains('is-previewing')) show(); });
    card.addEventListener('keydown', (e) => { if (e.key === 'Escape') card.classList.remove('is-previewing'); });
  });
})();
