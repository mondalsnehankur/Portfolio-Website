/* "A line I carry with me": a small night sky behind the quote.
   Tiny twinkling stars, plus three constellations that draw themselves when the section scrolls into view:
   Saptarshi (the Plough / Big Dipper) pointing to Polaris, Cassiopeia, and Orion. Rebuilt on resize. */
(() => {
  const sec = document.querySelector('.miles-quote-section'); if (!sec) return;
  const NS = 'http://www.w3.org/2000/svg', el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const rng = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const svg = el('svg', { class: 'mq-sky', 'aria-hidden': 'true', focusable: 'false' }); sec.prepend(svg);
  /* constellations in their own units: stars [x, y, size], lines as index pairs */
  const CONS = [
    { id: 'dipper', label: 'SAPTARSHI · URSA MAJOR', w: 200, h: 100,
      s: [[0, 52, 1.8], [46, 36, 2], [90, 28, 2.3], [128, 38, 2], [134, 80, 2.1], [196, 90, 2.4], [202, 40, 2.8], [250, -52, 3.1]],
      l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]], dashed: [[6, 7]], names: { 7: 'POLARIS' } },
    { id: 'cass', label: 'CASSIOPEIA', w: 130, h: 50,
      s: [[0, 12, 2], [30, 44, 2.3], [62, 22, 2.6], [96, 50, 2.1], [130, 18, 2.4]], l: [[0, 1], [1, 2], [2, 3], [3, 4]] },
    { id: 'orion', label: 'ORION', w: 100, h: 140,
      s: [[8, 0, 2.8], [92, 10, 2.3], [36, 72, 2.2], [54, 68, 2.4], [72, 64, 2.2], [18, 140, 2.2], [102, 132, 3]], l: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 1]] }];
  const build = () => {
    const W = sec.clientWidth, H = sec.clientHeight; if (!W || !H) return;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.replaceChildren();
    /* field of small stars; the ones behind the text are dimmer and smaller */
    const r = rng(77), n = Math.round(Math.max(36, Math.min(110, W * H / 8500))), field = el('g');
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = r() * H, behind = Math.abs(x - W / 2) < Math.min(W * .4, 450) && y > H * .2 && y < H * .86, big = r() > .88;
      const c = el('circle', { class: 'mq-s', cx: x.toFixed(1), cy: y.toFixed(1), r: (behind ? .7 : (big ? 1.8 : .75 + r() * .7)).toFixed(2) });
      c.style.setProperty('--o', (behind ? .3 + r() * .25 : .5 + r() * .5).toFixed(2)); c.style.animationDuration = (2.2 + r() * 4.5).toFixed(1) + 's'; c.style.animationDelay = (-r() * 6).toFixed(1) + 's';
      field.append(c);
    }
    svg.append(field);
    const wide = W >= 1000, sc = wide ? Math.max(.7, Math.min(1.15, W / 1380)) : Math.max(.5, Math.min(.8, W / 640));
    const place = wide
      ? { dipper: [W * .045, H * .1 + 56 * sc], cass: [W * .79, H * .08], orion: [W * .885, H * .42] }
      : { dipper: [W * .05, H * .03 + 52 * sc], cass: [W * .56, H * .03], orion: [W * .74, H * .8 - 140 * sc] };
    CONS.forEach((c, ci) => {
      const [ox, oy] = place[c.id], g = el('g', { class: 'mq-con' }), P = c.s.map((p) => [ox + p[0] * sc, oy + p[1] * sc, p[2]]);
      const seg = (a, b, cls, d) => { const p = el('path', { class: cls, d: `M${P[a][0].toFixed(1)} ${P[a][1].toFixed(1)}L${P[b][0].toFixed(1)} ${P[b][1].toFixed(1)}`, pathLength: 1 }); p.style.transitionDelay = d + 's'; g.append(p); };
      c.l.forEach((l, i) => seg(l[0], l[1], 'mq-line', (ci * .5 + i * .22).toFixed(2)));
      (c.dashed || []).forEach((l) => seg(l[0], l[1], 'mq-line mq-dash', (ci * .5 + c.l.length * .22 + .1).toFixed(2)));
      P.forEach((p, i) => {
        const s = el('circle', { class: 'mq-s mq-cs', cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: (p[2] * .85 * Math.max(.85, sc)).toFixed(2) });
        s.style.animationDuration = (3 + ((i * 7 + ci * 3) % 5) * .9).toFixed(1) + 's'; s.style.animationDelay = (-i * 1.3).toFixed(1) + 's'; g.append(s);
        if (c.names && c.names[i]) { const t = el('text', { class: 'mq-name', x: (p[0] + 8).toFixed(1), y: (p[1] + 3).toFixed(1) }); t.textContent = c.names[i]; g.append(t); }
      });
      const lb = el('text', { class: 'mq-label', x: ox.toFixed(1), y: (oy + (c.id === 'orion' ? 140 * sc + 18 : c.id === 'dipper' ? 78 * sc : 62 * sc)).toFixed(1) }); lb.textContent = c.label; g.append(lb); svg.append(g);
    });
  };
  build();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const was = sec.classList.contains('mq-in'); build(); if (was) sec.classList.add('mq-in'); }, 250); });
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { sec.classList.add('mq-in'); io.disconnect(); } }, { threshold: .25 }); io.observe(sec); } else sec.classList.add('mq-in');
})();
