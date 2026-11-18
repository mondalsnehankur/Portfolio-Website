/* Playful extras, all optional and none of them gate any content:
   1. Orbit slingshot: drag back from the probe, release, and gravity carries it. Landing on a moon jumps to that section.
   2. Reactive background: the line art behind sections drifts slightly with the cursor (see play.css).
   3. Hidden commands: type a secret word anywhere on the page (not inside a text box). See COMMANDS below. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const smooth = reduced ? 'auto' : 'smooth';
  const go = (sel, tries = 0) => {
    const el = document.querySelector(sel); if (!el) return;
    el.scrollIntoView({ behavior: smooth, block: 'start' });
    /* sections further down can grow while the page scrolls past them, so re-check and correct */
    if (tries < 4) setTimeout(() => { const t = el.getBoundingClientRect().top; if (t < -30 || t > 260) go(sel, tries + 1); }, 1100);
  };

  /* ---------- toast ---------- */
  let toastTimer;
  const toast = (msg) => {
    let t = $('fx-toast'); if (!t) { t = document.createElement('div'); t.id = 'fx-toast'; t.className = 'fx-toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  };

  /* ---------- 1. orbit slingshot ---------- */
  const stage = $('op-stage');
  if (stage) {
    const cv = stage.querySelector('canvas'), ctx = cv.getContext('2d'), padEl = $('op-pad'), readout = $('op-readout'), resetBtn = $('op-reset');
    const GM = 15000, SOFT = 260, MAXPULL = 120, POWER = 0.07, SUN_R = 17, TARGET_R = 19;
    const css = (n, f) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f;
    const TARGETS = [
      { label: 'Projects', href: '#project', fx: .74, fy: .22, v: '--c-teal', f: '#3dd9b0', kind: 'ringed' },
      { label: 'Skills', href: '#skills', fx: .91, fy: .5, v: '--c-amber', f: '#f5b73b', kind: 'banded' },
      { label: 'Research', href: '#current-work', fx: .74, fy: .76, v: '--c-sky', f: '#6aa8ff', kind: 'earth' },
      { label: 'Contact', href: '#contact', fx: .36, fy: .76, v: '--c-rose', f: '#ff7a90', kind: 'ice' },
    ];
    let W = 0, H = 0, dpr = 1, sun, pad, targets = [], stars = [];
    let state = 'idle', probe = null, trail = [], aim = null, kb = { ang: 0, pow: 70 }, flights = 0, hitT = null, endTimer = 0, visible = true, raf = 0, frames = 0;

    const layout = () => {
      W = stage.clientWidth; H = stage.clientHeight; dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sun = { x: W * .52, y: H * .5 }; pad = { x: 46, y: H * .5 };
      targets = TARGETS.map((t) => ({ ...t, x: W * t.fx, y: H * t.fy, r: TARGET_R, col: css(t.v, t.f) }));
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      stars = Array.from({ length: Math.round(W / 14) }, () => ({ x: rnd() * W, y: rnd() * H, r: rnd() * 1.2 + .3, a: rnd() * .6 + .2 }));
      padEl.style.left = pad.x + 'px'; padEl.style.top = pad.y + 'px';
      if (state === 'idle' || state === 'aim') probe = { x: pad.x, y: pad.y };
      draw();
    };

    /* one physics step (two half-steps for stability); returns an outcome or null */
    const step = (p) => {
      for (let s = 0; s < 2; s++) {
        const dx = sun.x - p.x, dy = sun.y - p.y, r2 = dx * dx + dy * dy + SOFT, k = GM / (r2 * Math.sqrt(r2)) * .5;
        p.vx += dx * k; p.vy += dy * k; p.x += p.vx * .5; p.y += p.vy * .5;
      }
      if (Math.hypot(p.x - sun.x, p.y - sun.y) < SUN_R) return { type: 'sun' };
      for (const t of targets) if (Math.hypot(p.x - t.x, p.y - t.y) < t.r + 4) return { type: 'hit', t };
      if (p.x < -90 || p.x > W + 90 || p.y < -90 || p.y > H + 90) return { type: 'lost' };
      return null;
    };
    const simulate = (vx, vy, max = 1400) => { const p = { x: pad.x, y: pad.y, vx, vy }; for (let i = 0; i < max; i++) { const o = step(p); if (o) return o; } return { type: 'lost' }; };
    const velFromPull = (px, py) => ({ vx: px * POWER, vy: py * POWER });

    const say = (m) => { readout.textContent = m; };
    const finish = (msg, afterMs, then) => { state = 'done'; say(msg); clearTimeout(endTimer); endTimer = setTimeout(() => { if (then) then(); resetProbe(); }, afterMs); };
    const resetProbe = () => { state = 'idle'; probe = { x: pad.x, y: pad.y }; trail = []; aim = null; hitT = null; draw(); };
    const launch = (px, py) => {
      const v = velFromPull(px, py); probe = { x: pad.x, y: pad.y, vx: v.vx, vy: v.vy }; trail = []; frames = 0; state = 'fly'; flights++; aim = null; say(`Launch ${flights}…`); kick();
    };

    /* aiming: pointer drag */
    const pull = (e) => { const r = cv.getBoundingClientRect(); let dx = pad.x - (e.clientX - r.left), dy = pad.y - (e.clientY - r.top); const m = Math.hypot(dx, dy); if (m > MAXPULL) { dx *= MAXPULL / m; dy *= MAXPULL / m; } return { dx, dy, m: Math.min(m, MAXPULL) }; };
    padEl.addEventListener('pointerdown', (e) => { if (state === 'fly') return; e.preventDefault(); clearTimeout(endTimer); resetProbe(); state = 'aim'; padEl.setPointerCapture(e.pointerId); aim = pull(e); padEl.classList.add('grabbing'); say('Aiming… release to launch'); kick(); });
    padEl.addEventListener('pointermove', (e) => { if (state === 'aim' && padEl.hasPointerCapture(e.pointerId)) { aim = pull(e); kick(); } });
    const release = (e) => { if (state !== 'aim') return; padEl.classList.remove('grabbing'); const a = aim; aim = null; if (a && a.m > 14) launch(a.dx, a.dy); else { state = 'idle'; say(''); draw(); } };
    padEl.addEventListener('pointerup', release); padEl.addEventListener('pointercancel', () => { padEl.classList.remove('grabbing'); if (state === 'aim') { state = 'idle'; aim = null; draw(); } });
    /* aiming: keyboard (arrows set angle and power, Enter launches) */
    padEl.addEventListener('keydown', (e) => {
      if (state === 'fly') return; const k = e.key; let used = true;
      if (k === 'ArrowUp') kb.ang -= .07; else if (k === 'ArrowDown') kb.ang += .07; else if (k === 'ArrowRight') kb.pow = Math.min(MAXPULL, kb.pow + 6); else if (k === 'ArrowLeft') kb.pow = Math.max(20, kb.pow - 6);
      else if (k === 'Enter' || k === ' ') { launch(Math.cos(kb.ang) * kb.pow, Math.sin(kb.ang) * kb.pow); } else used = false;
      if (used) { e.preventDefault(); if (state !== 'fly') { aim = { dx: Math.cos(kb.ang) * kb.pow, dy: Math.sin(kb.ang) * kb.pow, m: kb.pow, kb: true }; state = 'aim'; say(`Angle ${Math.round(-kb.ang * 57.3)}°, power ${Math.round(kb.pow / MAXPULL * 100)}%. Enter to launch`); kick(); } }
    });
    padEl.addEventListener('blur', () => { if (aim && aim.kb) { aim = null; state = 'idle'; draw(); } });
    resetBtn?.addEventListener('click', () => { clearTimeout(endTimer); resetProbe(); say('Ready'); });

    /* drawing */
    /* planets: each moon gets its own look (rings, bands, continents), lit from the sun's side */
    const tint = (hex, k) => { const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; };
    const hexOf = (c) => { if (c.startsWith('#')) return c; const m = c.match(/\d+/g); return m ? '#' + m.slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join('') : '#888888'; };
    const planet = (t, now) => {
      const { x, y, r } = t, base = hexOf(t.col), hot = hitT === t, la = Math.atan2(sun.y - y, sun.x - x);
      ctx.save();
      // glow
      const gl = ctx.createRadialGradient(x, y, r * .8, x, y, r * (hot ? 3.2 : 2.3)); gl.addColorStop(0, base + (hot ? '88' : '44')); gl.addColorStop(1, base + '00'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * (hot ? 3.2 : 2.3), 0, 6.283); ctx.fill();
      const ring = (tilt, ratio, radii, back) => { ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); radii.forEach(([k, w, a]) => { ctx.strokeStyle = tint(base, 1.25); ctx.globalAlpha = a; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(0, 0, r * k, r * k * ratio, 0, back ? Math.PI : 0, back ? 6.283 : Math.PI); ctx.stroke(); }); ctx.restore(); };
      const rings = { ringed: [-.42, .3, [[1.55, 4, .75], [1.85, 5, .5], [2.15, 2, .45]]], ice: [.5, .26, [[1.7, 2.2, .7], [1.95, 1, .5]]] }[t.kind];
      if (rings) ring(rings[0], rings[1], rings[2], true);
      // body
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.clip();
      const body = ctx.createLinearGradient(x, y - r, x, y + r); body.addColorStop(0, tint(base, 1.15)); body.addColorStop(1, tint(base, .72)); ctx.fillStyle = body; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      if (t.kind === 'banded') { [[-.62, .16, .35], [-.3, .22, .22], [.05, .12, .4], [.34, .2, .28], [.66, .14, .35]].forEach(([o, h, a]) => { ctx.fillStyle = `rgba(110,55,10,${a})`; ctx.fillRect(x - r, y + o * r - h * r / 2, r * 2, h * r); }); ctx.fillStyle = 'rgba(255,240,200,.35)'; ctx.beginPath(); ctx.ellipse(x + r * .25, y + r * .22, r * .22, r * .1, 0, 0, 6.283); ctx.fill(); }
      if (t.kind === 'ringed') { ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5; [-.45, -.1, .3].forEach((o) => { ctx.beginPath(); ctx.ellipse(x, y + o * r, r, r * .18, 0, 0, 6.283); ctx.stroke(); }); }
      if (t.kind === 'earth') { ctx.fillStyle = 'rgba(60,170,95,.95)'; [[-.35, -.25, .42, .3, .5], [.35, .22, .38, .28, -.4], [-.1, .55, .3, .16, .1]].forEach(([a, b, w, h, rot]) => { ctx.beginPath(); ctx.ellipse(x + a * r, y + b * r, w * r, h * r, rot, 0, 6.283); ctx.fill(); }); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; [[-.3, .05], [.25, -.5]].forEach(([a, b]) => { ctx.beginPath(); ctx.ellipse(x + a * r, y + b * r, r * .55, r * .12, .3, 0, 6.283); ctx.stroke(); }); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(x, y - r * .92, r * .4, r * .16, 0, 0, 6.283); ctx.fill(); }
      if (t.kind === 'ice') { ctx.fillStyle = 'rgba(120,20,50,.28)'; [[-.35, -.3, .17], [.3, .1, .13], [-.1, .45, .1], [.45, -.4, .08]].forEach(([a, b, c]) => { ctx.beginPath(); ctx.arc(x + a * r, y + b * r, c * r, 0, 6.283); ctx.fill(); }); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x, y - r * .9, r * .5, r * .2, 0, 0, 6.283); ctx.fill(); }
      const sh = ctx.createRadialGradient(x + Math.cos(la) * r * .45, y + Math.sin(la) * r * .45, r * .15, x, y, r * 1.08); sh.addColorStop(0, 'rgba(255,255,255,.28)'); sh.addColorStop(.45, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(2,6,24,.78)'); ctx.fillStyle = sh; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
      if (t.kind === 'earth') { ctx.strokeStyle = 'rgba(150,200,255,.5)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, r + 1, 0, 6.283); ctx.stroke(); }
      if (rings) ring(rings[0], rings[1], rings[2], false);
      if (t.kind === 'earth') { const mx = x + Math.cos(now * .9) * r * 1.9, my = y + Math.sin(now * .9) * r * .7; ctx.strokeStyle = 'rgba(200,215,255,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, r * 1.9, r * .7, 0, 0, 6.283); ctx.stroke(); ctx.fillStyle = '#cfd6e6'; ctx.beginPath(); ctx.arc(mx, my, r * .22, 0, 6.283); ctx.fill(); }
      if (t.kind === 'banded') { ctx.strokeStyle = 'rgba(255,225,160,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, r * 1.7, r * .5, -.3, 0, 6.283); ctx.stroke(); const a = now * 1.2; ctx.fillStyle = '#f3e2bf'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 1.7 * Math.cos(-.3) - Math.sin(a) * r * .5 * Math.sin(-.3), y + Math.cos(a) * r * 1.7 * Math.sin(-.3) + Math.sin(a) * r * .5 * Math.cos(-.3), r * .13, 0, 6.283); ctx.fill(); }
      ctx.restore();
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; stars.forEach((s) => { ctx.globalAlpha = s.a; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); }); ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(160,185,255,.14)'; ctx.lineWidth = 1; ctx.setLineDash([3, 7]); [60, 110, 170].forEach((r) => { ctx.beginPath(); ctx.arc(sun.x, sun.y, r, 0, 6.283); ctx.stroke(); }); ctx.setLineDash([]);
      const g = ctx.createRadialGradient(sun.x, sun.y, 2, sun.x, sun.y, 70); g.addColorStop(0, 'rgba(255,214,120,.55)'); g.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sun.x, sun.y, 70, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#ffd37a'; ctx.beginPath(); ctx.arc(sun.x, sun.y, SUN_R, 0, 6.283); ctx.fill();
      ctx.font = '600 12px Poppins, system-ui, sans-serif'; ctx.textAlign = 'center';
      const now = reduced ? 0 : performance.now() / 1000;
      targets.forEach((t) => { planet(t, now); ctx.fillStyle = '#e8eefc'; ctx.font = '600 12px Poppins, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t.label, t.x, t.y + t.r + 22); });
      // launch dock
      ctx.strokeStyle = 'rgba(180,200,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pad.x, pad.y, 24, 0, 6.283); ctx.stroke();
      if (aim) {
        const px = pad.x - aim.dx, py = pad.y - aim.dy;
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(pad.x, pad.y); ctx.lineTo(aim.kb ? pad.x - aim.dx * .5 : px, aim.kb ? pad.y - aim.dy * .5 : py); ctx.stroke();
        const v = velFromPull(aim.dx, aim.dy), p = { x: pad.x, y: pad.y, vx: v.vx, vy: v.vy };
        for (let i = 0; i < 260; i++) { const o = step(p); if (i % 7 === 0) { ctx.fillStyle = `rgba(255,255,255,${Math.max(.08, .75 - i / 330)})`; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 6.283); ctx.fill(); } if (o) break; }
      }
      if (trail.length) { ctx.lineWidth = 2; for (let i = 1; i < trail.length; i++) { ctx.strokeStyle = `rgba(150,220,255,${i / trail.length * .8})`; ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke(); } }
      const px = aim && !aim.kb ? pad.x - aim.dx : probe.x, py = aim && !aim.kb ? pad.y - aim.dy : probe.y;
      ctx.fillStyle = '#fff'; ctx.shadowColor = '#7fd6ff'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(px, py, 6, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
      if (!flights && state === 'idle' && W > 600) { ctx.fillStyle = 'rgba(232,238,252,.8)'; ctx.font = '500 11px Poppins, system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillText('drag me back, then let go', pad.x + 34, pad.y + 4); }
    };

    const tick = () => {
      raf = 0;
      if (state === 'fly') {
        const o = step(probe); trail.push({ x: probe.x, y: probe.y }); if (trail.length > 90) trail.shift(); frames++;
        if (o && o.type === 'hit') { hitT = o.t; finish(`Landed on ${o.t.label}. Taking you there…`, 900, () => go(o.t.href)); }
        else if (o && o.type === 'sun') finish('Burned up in the sun. Try again.', 1100);
        else if (o && o.type === 'lost') finish('Lost in space. Try again.', 1000);
        else if (frames > 1500) finish('Out of fuel. Try again.', 1000);
      }
      draw();
      if (visible && (state === 'fly' || state === 'aim' || state === 'done' || !reduced)) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { threshold: 0.05 }).observe(stage);
    new ResizeObserver(() => { clearTimeout(layout._t); layout._t = setTimeout(layout, 120); }).observe(stage);
    layout(); kick();
    window.OrbitPlay = { simulate, velFromPull, launch, targets: () => targets, pad: () => pad, state: () => state, maxPull: MAXPULL };
  }

  /* ---------- 2. reactive background ---------- */
  if (!reduced && matchMedia('(pointer: fine)').matches) {
    let rx = 0, ry = 0, queued = false; const root = document.documentElement;
    addEventListener('pointermove', (e) => {
      rx = e.clientX / innerWidth * 2 - 1; ry = e.clientY / innerHeight * 2 - 1;
      if (!queued) { queued = true; requestAnimationFrame(() => { root.style.setProperty('--mx', rx.toFixed(3)); root.style.setProperty('--my', ry.toFixed(3)); queued = false; }); }
    }, { passive: true });
  }

  /* ---------- 3. hidden commands ---------- */
  let rainOn = false;
  const rain = () => {
    if (reduced) { toast('Matrix mode skipped because reduced motion is on.'); return; } if (rainOn) return; rainOn = true;
    const root = document.documentElement, prevTheme = root.getAttribute('data-theme'); root.setAttribute('data-theme', 'dark'); /* rain is only readable on dark; the saved choice is untouched and restored below */
    const c = document.createElement('canvas'); c.className = 'fx-rain'; c.setAttribute('aria-hidden', 'true'); document.body.append(c);
    const x = c.getContext('2d'); const w = c.width = innerWidth, h = c.height = innerHeight, size = 16, cols = Math.ceil(w / size), drops = Array.from({ length: cols }, () => Math.random() * -40);
    const chars = '01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ{}<>/=+*'; let last = 0; const t0 = performance.now(); toast('Follow the white rabbit…');
    const loop = (now) => {
      if (now - last > 45) { last = now; x.fillStyle = 'rgba(0,10,6,.14)'; x.fillRect(0, 0, w, h); x.fillStyle = '#00ff9c'; x.font = `${size}px monospace`; drops.forEach((d, i) => { x.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, d * size); drops[i] = d * size > h && Math.random() > .975 ? 0 : d + 1; }); }
      const age = now - t0;
      if (age > 7000) { c.classList.add('out'); setTimeout(() => { c.remove(); rainOn = false; if (prevTheme === null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', prevTheme); }, 700); return; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
  const COMMANDS = {
    sudo: () => { toast('sudo: permission granted. Opening the terminal.'); go('#terminal'); setTimeout(() => $('terminal-input')?.focus({ preventScroll: true }), 900); },
    matrix: rain,
    orbit: () => { toast('Orbit mode: aim carefully.'); go('#orbit-play'); },
    morph: () => window.__morphToggle && window.__morphToggle(),
    hello: () => toast('Hello, and thanks for looking around.'),
    theme: () => { document.querySelector('[data-theme-toggle], .theme-toggle')?.click(); toast('Theme switched.'); },
  };
  const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let word = '', seq = [];
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.documentElement.classList.contains('gated')) return;
    const el = e.target; if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    const k = e.key.toLowerCase();
    seq.push(k); if (seq.length > KONAMI.length) seq.shift(); if (seq.length === KONAMI.length && seq.every((v, i) => v === KONAMI[i])) { seq = []; rain(); return; }
    if (k.length === 1 && /[a-z]/.test(k)) { word = (word + k).slice(-10); for (const name of Object.keys(COMMANDS)) if (word.endsWith(name)) { word = ''; COMMANDS[name](); break; } }
  });

  /* ---------- 4. morph: shapes that transform from one section to the next (like PowerPoint's Morph) ----------
     a) A small point-cloud widget, bottom right, reshapes as you scroll: atom, wave, graph, grid, chip, globe, bars, galaxy, Saturn.
        Its position in each morph is tied to scroll, so scrolling back reverses it.
     b) The line art behind each section scales, tilts and fades with its distance from the screen centre, so one section's art
        dissolves into the next one's (see play.css). Both are off or static under reduced motion. Type "morph" to hide/show the widget. */
  (() => {
    const N = 140, SEQ = [['home', 0], ['orbit-play', 8], ['current-work', 1], ['about', 2], ['project', 4], ['ebooks', 7], ['skills', 3], ['exper', 6], ['education', 5], ['leadership', 2], ['credentials', 3], ['project-metrics', 6], ['github-activity', 1], ['problem-solving', 3], ['notes', 7], ['career-lab', 4], ['terminal', 3], ['contact', 8]];
    const NAMES = ['atom', 'ψ(x, t)', 'G = (V, E)', '0 1 0 1', 'chip', 'globe', 'metrics', 'galaxy', 'orbit'];
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const TAU = Math.PI * 2, P = (x, y, z = 0) => ({ x, y, z });
    const fit = (pts) => { const a = pts.map((p) => ({ ...p, a: Math.atan2(p.y, p.x) })).sort((u, v) => u.a - v.a); return Array.from({ length: N }, (_, i) => { const p = a[Math.floor(i * a.length / N)]; return P(p.x, p.y, p.z); }); };
    const sphere = (n, r) => Array.from({ length: n }, (_, i) => { const y = 1 - 2 * (i + .5) / n, rr = Math.sqrt(1 - y * y), th = i * 2.399963; return P(Math.cos(th) * rr * r, y * r, Math.sin(th) * rr * r); });
    const shapes = [
      /* 0 atom */ (() => { const o = []; for (let i = 0; i < 10; i++) o.push(P((rnd() - .5) * .22, (rnd() - .5) * .22, (rnd() - .5) * .22)); [0, 1, 2].forEach((k) => { const th = k * Math.PI / 3; for (let i = 0; i < 43; i++) { const u = i / 43 * TAU, x = .88 * Math.cos(u), y = .34 * Math.sin(u); o.push(P(x * Math.cos(th) - y * Math.sin(th), x * Math.sin(th) + y * Math.cos(th), .3 * Math.sin(u + k * 2))); } }); return fit(o); })(),
      /* 1 wave */ (() => { const o = []; for (let i = 0; i < 70; i++) { const x = -1 + 2 * i / 69; o.push(P(x * .95, .42 * Math.sin(3 * Math.PI * x) * Math.exp(-x * x * .6))); o.push(P(x * .95, .22 * Math.sin(6 * Math.PI * x + 1) * Math.exp(-x * x * .6) - .02)); } return fit(o); })(),
      /* 2 graph */ (() => { const rings = [[0, 1], [.3, 7], [.6, 14], [.92, 22]], nodes = []; rings.forEach(([r, n], k) => { for (let i = 0; i < n; i++) { const u = i / n * TAU + k * .5; nodes.push({ k, x: r * Math.cos(u), y: r * Math.sin(u) }); } }); const o = nodes.map((n) => P(n.x, n.y)); nodes.forEach((n) => { if (!n.k) return; const inner = nodes.filter((m) => m.k === n.k - 1).sort((u, v) => Math.hypot(u.x - n.x, u.y - n.y) - Math.hypot(v.x - n.x, v.y - n.y))[0]; for (const t of [.33, .66]) o.push(P(n.x + (inner.x - n.x) * t, n.y + (inner.y - n.y) * t)); }); return fit(o); })(),
      /* 3 grid */ (() => { const o = []; for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) o.push(P(-.9 + 1.8 * c / 11, -.9 + 1.8 * r / 11)); return fit(o); })(),
      /* 4 chip */ (() => { const o = []; const sq = (h, n) => { for (let i = 0; i < n; i++) { const t = i / n * 4, s = Math.floor(t), f = t - s; const pts = [[-h + 2 * h * f, -h], [h, -h + 2 * h * f], [h - 2 * h * f, h], [-h, h - 2 * h * f]]; o.push(P(pts[s][0], pts[s][1])); } }; sq(.62, 56); sq(.36, 32); for (let k = 0; k < 4; k++) for (let i = 0; i < 6; i++) { const t = -.5 + i * .2, a = k * Math.PI / 2, c = Math.cos(a), s2 = Math.sin(a); [[.7, t], [.88, t]].forEach(([d, e]) => o.push(P(d * c - e * s2, d * s2 + e * c))); } return fit(o); })(),
      /* 5 globe */ (() => { const o = []; for (let k = 1; k <= 5; k++) { const lat = -Math.PI / 2 + k * Math.PI / 6, r = Math.cos(lat) * .85; for (let i = 0; i < 16; i++) { const u = i / 16 * TAU; o.push(P(r * Math.cos(u), Math.sin(lat) * .85, r * Math.sin(u))); } } for (let m = 0; m < 4; m++) for (let i = 0; i < 15; i++) { const v = -Math.PI / 2 + (i + .5) / 15 * Math.PI, u = m * Math.PI / 4 * 2 / 1; o.push(P(Math.cos(v) * Math.cos(u) * .85, Math.sin(v) * .85, Math.cos(v) * Math.sin(u) * .85)); } return fit(o); })(),
      /* 6 bars */ (() => { const o = []; [.3, .5, .4, .75, .6, .9, .7, 1].forEach((h, i) => { const x = -.85 + i * .243, n = Math.floor(h * 10) + 1; for (let k = 0; k < n; k++) o.push(P(x, .85 - k * .17)); }); return fit(o); })(),
      /* 7 galaxy */ (() => { const o = []; for (let a = 0; a < 2; a++) for (let i = 0; i < 70; i++) { const f = i / 70, r = .08 + .9 * f, th = f * 4.2 + a * Math.PI; o.push(P(r * Math.cos(th), r * Math.sin(th) * .8, (rnd() - .5) * .2)); } return fit(o); })(),
      /* 8 saturn */ (() => { const o = sphere(50, .42); for (let i = 0; i < 90; i++) { const u = i / 90 * TAU, R = i % 2 ? .95 : .68, x = R * Math.cos(u), z = R * Math.sin(u); o.push(P(x, z * .45 * -1 * .0 + (-.3 * x), z)); } return fit(o); })(),
    ];
    window.MorphShapes = { count: shapes.length, sizes: shapes.map((a) => a.length) };

    const hud = document.createElement('div'); hud.className = 'morph-hud'; hud.setAttribute('aria-hidden', 'true');
    const cv = document.createElement('canvas'); hud.append(cv); document.body.append(hud);
    const ctx = cv.getContext('2d'); let size = 0, dpr = 1, on = true;
    const sizeIt = () => { size = hud.clientWidth; dpr = Math.min(2, devicePixelRatio || 1); cv.width = cv.height = Math.round(size * dpr); cv.style.width = cv.style.height = size + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    sizeIt(); addEventListener('resize', sizeIt);

    const probe = document.createElement('canvas').getContext('2d'); const colCache = new Map(); let themeKey = '';
    const rgbOf = (v) => { probe.fillStyle = '#7fd6ff'; probe.fillStyle = v || '#7fd6ff'; const f = probe.fillStyle; if (f[0] === '#') { const n = parseInt(f.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; } const m = f.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [127, 214, 255]; };
    const colorOf = (sec) => { const k = document.documentElement.getAttribute('data-theme') || 'dark'; if (k !== themeKey) { colCache.clear(); themeKey = k; } if (!colCache.has(sec)) colCache.set(sec, rgbOf(getComputedStyle(sec).getPropertyValue('--hue').trim() || getComputedStyle(document.documentElement).getPropertyValue('--accent-2').trim())); return colCache.get(sec); };

    let list = []; const collect = () => { list = SEQ.map(([id, sh]) => ({ el: $(id), sh })).filter((x) => x.el && x.el.getClientRects().length); };
    collect();
    const ART = ['current-work', 'about', 'project', 'ebooks', 'skills', 'exper', 'education', 'leadership', 'credentials', 'project-metrics', 'github-activity', 'notes', 'career-lab', 'terminal'].map($).filter(Boolean);

    let st = { a: 0, b: 0, t: 0 }, dirty = true, tick = 0;
    const ease = (t) => t * t * (3 - 2 * t);
    const compute = () => {
      const centre = innerHeight * .5, W = 460, r = list.map((x) => x.el.getBoundingClientRect());
      if (r.length < 2) { st = { a: 0, b: 0, t: 0 }; return; }
      for (let k = 0; k < r.length - 1; k++) {
        const bd = (r[k].bottom + r[k + 1].top) / 2;
        if (centre < bd - W / 2) { st = { a: k, b: k, t: 0 }; return; }
        if (centre <= bd + W / 2) { st = { a: k, b: k + 1, t: ease((centre - (bd - W / 2)) / W) }; return; }
      }
      st = { a: r.length - 1, b: r.length - 1, t: 0 };
    };
    const updateArt = () => { const vh = innerHeight; ART.forEach((el) => { const r = el.getBoundingClientRect(); const sp = Math.max(-1, Math.min(1, ((r.top + r.height / 2) - vh / 2) / (vh * .5 + r.height * .5))); el.style.setProperty('--sp', sp.toFixed(3)); el.style.setProperty('--sa', Math.abs(sp).toFixed(3)); }); };

    const draw = (time) => {
      const { a, b } = st; let t = st.t; if (reduced) t = t > .5 ? 1 : 0;
      const A = shapes[list[a].sh], B = shapes[list[b].sh], ca = colorOf(list[a].el), cb = colorOf(list[b].el);
      const col = ca.map((v, i) => Math.round((v + (cb[i] - v) * t) * .55 + 255 * .45)), c = size / 2, sc = size * .36;
      const ang = reduced ? .35 : Math.sin(time * .0006) * .45 + .1, cs = Math.cos(ang), sn = Math.sin(ang), wob = reduced ? 0 : Math.sin(time * .0004) * .15;
      ctx.clearRect(0, 0, size, size);
      const pts = A.map((p, i) => { const q = B[i], x = p.x + (q.x - p.x) * t, y = p.y + (q.y - p.y) * t, z = p.z + (q.z - p.z) * t; const jig = Math.sin(t * Math.PI) * .12 * Math.sin(i * 12.9898); /* a little scatter mid-morph */ const X = x * cs + z * sn + jig, Z = -x * sn + z * cs; return { x: c + X * sc, y: c + (y * Math.cos(wob) - Z * Math.sin(wob) + jig) * sc, d: Z }; });
      const th = size * .17; ctx.lineWidth = 1;
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d2 = dx * dx + dy * dy; if (d2 < th * th) { ctx.strokeStyle = `rgba(${col},${(.5 * (1 - Math.sqrt(d2) / th)).toFixed(3)})`; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); } }
      ctx.fillStyle = `rgb(${col})`; pts.forEach((p) => { ctx.globalAlpha = .65 + .35 * Math.max(-1, Math.min(1, p.d)) * .5 + .15; ctx.beginPath(); ctx.arc(p.x, p.y, size > 130 ? 1.9 : 1.5, 0, TAU); ctx.fill(); }); ctx.globalAlpha = 1;
      ctx.font = `500 ${size > 130 ? 10 : 8}px 'JetBrains Mono', ui-monospace, monospace`; ctx.textAlign = 'center'; const la = t < .5 ? list[a] : list[b]; ctx.fillStyle = `rgba(215,226,252,${Math.abs(1 - 2 * t)})`; ctx.fillText(NAMES[la.sh], c, size - 9);
    };

    const loop = (time) => { tick = 0; if (!document.hidden && on) { if (dirty) { compute(); updateArt(); dirty = false; } draw(time); } if (!reduced && on) tick = requestAnimationFrame(loop); };
    const need = () => { dirty = true; if (reduced && !tick && on) tick = requestAnimationFrame(loop); };
    addEventListener('scroll', need, { passive: true }); addEventListener('resize', () => { collect(); need(); });
    new ResizeObserver(() => { collect(); need(); }).observe(document.body);
    if (!reduced) tick = requestAnimationFrame(loop); else need();
    /* stay out of the way: fade when the pointer comes close */
    if (matchMedia('(pointer: fine)').matches) addEventListener('pointermove', (e) => { const r = hud.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)); hud.style.opacity = d < r.width * .85 ? .15 : ''; }, { passive: true });
    window.__morphToggle = () => { on = !on; hud.style.display = on ? '' : 'none'; if (on) { dirty = true; if (!tick) tick = requestAnimationFrame(loop); } toast(on ? 'Morph widget on.' : 'Morph widget off.'); };
    window.MorphDebug = { state: () => st, list: () => list.map((x) => x.el.id || x.el.tagName) };
  })();
})();
