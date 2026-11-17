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
    const GM = 15000, SOFT = 260, MAXPULL = 120, POWER = 0.07, SUN_R = 17, TARGET_R = 15;
    const css = (n, f) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f;
    const TARGETS = [
      { label: 'Projects', href: '#project', fx: .74, fy: .2, v: '--c-teal', f: '#3dd9b0' },
      { label: 'Skills', href: '#skills', fx: .93, fy: .5, v: '--c-amber', f: '#f5b73b' },
      { label: 'Research', href: '#current-work', fx: .74, fy: .8, v: '--c-sky', f: '#6aa8ff' },
      { label: 'Contact', href: '#contact', fx: .36, fy: .86, v: '--c-rose', f: '#ff7a90' },
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
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff'; stars.forEach((s) => { ctx.globalAlpha = s.a; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); }); ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(160,185,255,.14)'; ctx.lineWidth = 1; ctx.setLineDash([3, 7]); [60, 110, 170].forEach((r) => { ctx.beginPath(); ctx.arc(sun.x, sun.y, r, 0, 6.283); ctx.stroke(); }); ctx.setLineDash([]);
      const g = ctx.createRadialGradient(sun.x, sun.y, 2, sun.x, sun.y, 70); g.addColorStop(0, 'rgba(255,214,120,.55)'); g.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sun.x, sun.y, 70, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#ffd37a'; ctx.beginPath(); ctx.arc(sun.x, sun.y, SUN_R, 0, 6.283); ctx.fill();
      ctx.font = '600 12px Poppins, system-ui, sans-serif'; ctx.textAlign = 'center';
      targets.forEach((t) => {
        const hot = hitT === t, pulse = reduced ? 0 : Math.sin(performance.now() / 500 + t.x) * 2;
        ctx.strokeStyle = t.col; ctx.globalAlpha = .35; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(t.x, t.y, t.r + 7 + pulse + (hot ? 8 : 0), 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = t.col; ctx.beginPath(); ctx.arc(t.x, t.y, hot ? t.r + 2 : t.r - 3, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#e8eefc'; ctx.fillText(t.label, t.x, t.y + t.r + 20);
      });
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
    const c = document.createElement('canvas'); c.className = 'fx-rain'; c.setAttribute('aria-hidden', 'true'); document.body.append(c);
    const x = c.getContext('2d'); const w = c.width = innerWidth, h = c.height = innerHeight, size = 16, cols = Math.ceil(w / size), drops = Array.from({ length: cols }, () => Math.random() * -40);
    const chars = '01ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ{}<>/=+*'; let last = 0; const t0 = performance.now(); toast('Follow the white rabbit…');
    const loop = (now) => {
      if (now - last > 45) { last = now; x.fillStyle = 'rgba(0,10,6,.14)'; x.fillRect(0, 0, w, h); x.fillStyle = '#00ff9c'; x.font = `${size}px monospace`; drops.forEach((d, i) => { x.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, d * size); drops[i] = d * size > h && Math.random() > .975 ? 0 : d + 1; }); }
      const age = now - t0;
      if (age > 7000) { c.classList.add('out'); setTimeout(() => { c.remove(); rainOn = false; }, 700); return; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
  const COMMANDS = {
    sudo: () => { toast('sudo: permission granted. Opening the terminal.'); go('#terminal'); setTimeout(() => $('terminal-input')?.focus({ preventScroll: true }), 900); },
    matrix: rain,
    orbit: () => { toast('Orbit mode: aim carefully.'); go('#orbit-play'); },
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
})();
