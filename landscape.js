/* Landscape background (landscape.js)
   Fixed layers behind the page: sky, far snow peaks, mid hills with pines, near hills with framing trees, drifting leaves.
   Scrolling moves a slow camera (zoom + sideways drift, different amounts per layer, so the zoom has depth) and the
   light runs from dawn to night along the page, ending where the night-city footer begins.
   Edit SHOTS to change the camera per section; PAL_DARK / PAL_LIGHT for the light. Reduced motion: one still frame. */
(() => {
  const root = document.documentElement, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => innerWidth < 700;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, sm = (t) => (t = clamp(t, 0, 1)) * t * (3 - 2 * t);

  /* camera shot per section: z = zoom, x = sideways drift (-1..1), y = tilt down toward the city (0..1), t = time of day (0 dawn .. 1 night) */
  const SHOTS = [['home', { z: 1, x: -.6, y: 0, t: 0 }], ['about', { z: 1.12, x: .55, y: .2, t: .1 }], ['project', { z: 1.19, x: 0, y: .32, t: .27 }], ['skills', { z: 1.06, x: -.6, y: -.1, t: .43 }],
    ['exper', { z: 1.14, x: .45, y: .4, t: .54 }], ['career-lab', { z: 1.04, x: -.35, y: .1, t: .7 }], ['contact', { z: 1.22, x: .25, y: .45, t: .9 }], ['END', { z: 1.12, x: 0, y: .7, t: 1 }]];
  /* sky, tint over the scene, haze, sun/moon colour (stops along t) */
  const PAL_DARK = [[0, '#0c1232', '#6b4a7a', [255, 150, 120, .07], [107, 74, 122, .55], '#ffb48a'], [.25, '#0e1a3c', '#2e4d7e', [120, 170, 255, .05], [46, 77, 126, .5], '#ffe3b0'], [.5, '#151030', '#9a5a55', [255, 140, 90, .09], [154, 90, 85, .5], '#ff9d6a'],
    [.75, '#0a0c24', '#3a2a5c', [120, 90, 200, .1], [58, 42, 92, .55], '#cdbfff'], [1, '#05070f', '#0d1226', [10, 20, 60, .28], [13, 18, 38, .6], '#dfe8ff']];
  const PAL_LIGHT = [[0, '#cfd8ff', '#ffd9c7', [255, 190, 150, .12], [255, 217, 199, .6], '#fff0c2'], [.25, '#a9c9ff', '#e8f3ff', [255, 255, 255, 0], [232, 243, 255, .6], '#fff6cf'], [.5, '#bcc9f5', '#ffe3b8', [255, 200, 120, .1], [255, 227, 184, .6], '#ffd27a'],
    [.75, '#8d8fd0', '#ffb89a', [255, 150, 130, .12], [255, 184, 154, .55], '#ffb27a'], [1, '#4a5290', '#c58fa8', [60, 60, 140, .2], [197, 143, 168, .55], '#f2eaff']];

  /* ---------- helpers ---------- */
  const rng = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const noise = (seed) => { const r = rng(seed), v = Array.from({ length: 512 }, r); return (x) => { const i = Math.floor(x), f = x - i, a = v[i & 511], b = v[(i + 1) & 511], t = f * f * (3 - 2 * f); return a + (b - a) * t; }; };
  const fbm = (n, x, o) => { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * n(x * f + i * 17.3); f *= 2; a *= .5; } return s; };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const rgb = (c, al) => al == null ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${al.toFixed(3)})`;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- build ---------- */
  const land = document.createElement('div'); land.id = 'land'; land.setAttribute('aria-hidden', 'true');
  land.innerHTML = '<div class="ld-sky"></div><div class="ld-stars"></div><div class="ld-sun"></div><div class="ld-layer ld-far"></div><div class="ld-haze ld-h1"></div><div class="ld-layer ld-mid"></div><div class="ld-haze ld-h2"></div><div class="ld-layer ld-near"></div><canvas class="ld-fx"></canvas><div class="ld-tint"></div><div class="ld-scrim"></div>';
  document.body.prepend(land); root.classList.add('land-on');
  const q = (s) => land.querySelector(s);
  const sky = q('.ld-sky'), stars = q('.ld-stars'), sun = q('.ld-sun'), far = q('.ld-far'), mid = q('.ld-mid'), near = q('.ld-near'), h1 = q('.ld-h1'), h2 = q('.ld-h2'), tint = q('.ld-tint'), fx = q('.ld-fx');

  /* ---------- procedural ridgelines ---------- */
  const treePath = (x, base, h, r, pine) => {
    if (pine) { let d = ''; for (let k = 0; k < 3; k++) { const top = base - h + k * h * .27, bot = base - h * (1 - (k + 1) * .27) + h * .1, hw = h * (.2 + k * .1); d += `M${x},${top}L${x + hw},${bot}L${x - hw},${bot}Z`; } return d + `M${x - 1.5},${base - h * .08}h3v${h * .1}h-3Z`; }
    const rr = h * .3; return `M${x - rr},${base - h * .55}a${rr},${rr} 0 1,0 ${2 * rr},0a${rr},${rr} 0 1,0 ${-2 * rr},0ZM${x - 1.6},${base - h * .3}h3.2v${h * .32}h-3.2Z`;
  };
  const build = () => {
    const W = Math.round(innerWidth * 1.3), VH = innerHeight, mob = mobile(), step = mob ? 10 : 6;
    /* silhouettes are drawn once into bitmaps (Path2D), so scrolling only moves textures instead of re-rasterising big SVGs */
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const mk = (el, hh, fn) => { el.style.height = hh + 'px'; el.replaceChildren(); const cv = document.createElement('canvas'); cv.width = Math.round(W * dpr); cv.height = Math.round(hh * dpr); el.append(cv); const items = []; fn(items, hh); el._items = items; el._cv = cv; el._dpr = dpr; };
    const path = (items, d, cls) => { items.push([d, cls || '']); };
    /* far: sharp snow peaks */
    mk(far, Math.round(VH * .8) + 140, (svg, H) => {
      const n = noise(11), top = H - 140 - VH * .64, pts = []; for (let x = 0; x <= W; x += step) { const e = fbm(n, x / (W / 4.2), 5), r = 1 - Math.abs(2 * e - 1); pts.push([x, top + (1 - r) * VH * .44 + (1 - e) * VH * .06]); }
      let d = `M0,${H}`; pts.forEach((p) => { d += `L${p[0]},${p[1].toFixed(1)}`; }); path(svg, d + `L${W},${H}Z`, 'body');
      const line = top + VH * .2; let snow = ''; let run = [];
      const flush = () => { if (run.length > 2) { snow += `M${run[0][0]},${run[0][1].toFixed(1)}`; run.forEach((p) => { snow += `L${p[0]},${p[1].toFixed(1)}`; }); const r = rng(run[0][0] | 0); for (let k = run.length - 1; k >= 0; k--) { const p = run[k], dep = (line - p[1]) * (.55 + .5 * r()) + 6 * r(); snow += `L${p[0]},${(Math.min(line + 8, p[1] + dep + (k % 2 ? 6 : 0))).toFixed(1)}`; } snow += 'Z'; } run = []; };
      pts.forEach((p) => { if (p[1] < line) run.push(p); else flush(); }); flush(); path(svg, snow, 'snow');
    });
    /* mid: rolling hills with pines and a few leafy trees */
    mk(mid, Math.round(VH * .46) + 140, (svg, H) => {
      const n = noise(23), r = rng(5), base = H - 140 - VH * .24, ys = (x) => base + (fbm(n, x / (W / 3.4), 3) - .5) * VH * .22; let d = `M0,${H}`;
      for (let x = 0; x <= W; x += step) d += `L${x},${ys(x).toFixed(1)}`; d += `L${W},${H}Z`;
      for (let x = 10; x < W; x += (mob ? 22 : 12) + r() * (mob ? 34 : 24)) { const h = (VH * .045 + r() * VH * .07) * (.7 + .5 * fbm(n, x / 400 + 9, 2)); d += treePath(x, ys(x) + 4, h, 0, r() < .78); }
      path(svg, d);
    });
    /* near: darker hills, tall trees framing the left and right */
    mk(near, Math.round(VH * .36) + 140, (svg, H) => {
      const n = noise(37), r = rng(9), base = H - 140 - VH * .13, ys = (x) => base + (fbm(n, x / (W / 2.6), 3) - .5) * VH * .14; let d = `M0,${H}`;
      for (let x = 0; x <= W; x += step) d += `L${x},${ys(x).toFixed(1)}`; d += `L${W},${H}Z`;
      const edge = (x) => { const u = x / W, e = Math.min(u, 1 - u); return 1 - clamp(e / .28, 0, 1); };
      for (let x = 20; x < W; x += (mob ? 40 : 26) + r() * 50) { const e = edge(x); if (r() > .22 + e * .85) continue; const h = VH * (.06 + r() * .06 + e * .17); d += treePath(x, ys(x) + 6, h, 0, r() < .8); }
      for (let x = 0; x < W; x += (mob ? 14 : 7) + r() * 6) { const y = ys(x) + 3, h = 6 + r() * 12; d += `M${x},${y}L${x + 1.6},${y - h}L${x + 3.2},${y}Z`; } /* grass blades */
      path(svg, d);
    });
    /* stars as a tiled dot field */
    const sr = rng(77), c = document.createElement('canvas'); c.width = c.height = 360; const sc = c.getContext('2d'); for (let i = 0; i < 46; i++) { sc.fillStyle = `rgba(255,255,255,${(.35 + sr() * .65).toFixed(2)})`; sc.beginPath(); sc.arc(sr() * 360, sr() * 360, .5 + sr() * 1.1, 0, 6.283); sc.fill(); }
    stars.style.backgroundImage = `url(${c.toDataURL()})`;
    /* haze bands sit on the base of the far and mid layers */
    h1.style.bottom = Math.round(VH * .2) + 'px'; h2.style.bottom = Math.round(VH * .02) + 'px';
  };

  const paintLayers = () => {
    const cs = getComputedStyle(land), col = { far: cs.getPropertyValue('--ld-far'), mid: cs.getPropertyValue('--ld-mid'), near: cs.getPropertyValue('--ld-near'), snow: cs.getPropertyValue('--ld-snow') };
    const rim = (cs.getPropertyValue('--ld-rim') || 'rgba(255,255,255,.3)').trim();
    [[far, 'far'], [mid, 'mid'], [near, 'near']].forEach(([el, k]) => {
      if (!el._cv) return; const c = el._cv.getContext('2d'), cw = el._cv.width / el._dpr, ch = el._cv.height / el._dpr;
      c.setTransform(el._dpr, 0, 0, el._dpr, 0, 0); c.clearRect(0, 0, cw, ch);
      el._items.forEach(([d, cls]) => {
        const p = new Path2D(d);
        if (cls !== 'snow') { c.save(); c.translate(0, k === 'far' ? -1.6 : -2.4); c.globalAlpha = k === 'far' ? 1 : (k === 'mid' ? .8 : .6); c.fillStyle = rim; c.fill(p); c.restore(); } /* thin lit edge on every ridge and treetop */
        c.fillStyle = (cls === 'snow' ? col.snow : col[k]).trim(); c.fill(p);
      });
      c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(0, 0, 0, ch); /* light falls off with height: a lit top, a darker foot */
      g.addColorStop(0, `rgba(255,255,255,${k === 'far' ? .12 : .07})`); g.addColorStop(.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.34)'); c.fillStyle = g; c.fillRect(0, 0, cw, ch); c.globalCompositeOperation = 'source-over';
    });
    if (window.Landscape) window.Landscape.onPaint.forEach((fn) => fn());
  };

  /* ---------- camera + light ---------- */
  let anchors = [], docH = 1, pal = PAL_DARK;
  const themePal = () => { pal = root.getAttribute('data-theme') === 'light' ? PAL_LIGHT : PAL_DARK; last.t = -1; lightT = -1; paintLayers(); };
  const measure = () => {
    const vh = innerHeight, sy = scrollY; docH = document.documentElement.scrollHeight;
    anchors = SHOTS.map(([id, s]) => { if (id === 'END') return { y: Math.max(1, docH - vh), s }; const e = document.getElementById(id); return e ? { y: e.getBoundingClientRect().top + sy - vh * .45, s } : null; }).filter(Boolean);
    anchors[0].y = 0; anchors.sort((a, b) => a.y - b.y);
  };
  const shotAt = (y) => {
    let i = 0; while (i < anchors.length - 1 && y >= anchors[i + 1].y) i++;
    const a = anchors[i], b = anchors[Math.min(i + 1, anchors.length - 1)], k = b === a ? 0 : sm((y - a.y) / Math.max(1, b.y - a.y));
    return { z: lerp(a.s.z, b.s.z, k), x: lerp(a.s.x, b.s.x, k), y: lerp(a.s.y, b.s.y, k), t: lerp(a.s.t, b.s.t, k) };
  };
  const cur = { z: 1, x: -.6, y: 0, t: 0 }, last = { z: -1, x: -1, y: -1, t: -1 };
  const KS = { far: [.3, .16, 6], mid: [.8, .75, 46], near: [1.65, 1.8, 115] }; /* wider spread = clearer depth */
  const pm = { x: 0, y: 0, tx: 0, ty: 0 }, lpm = { x: 0, y: 0 }; let inert = 0, linert = 0, prog = 0; /* inert = scroll-speed lag, prog = 0..1 page progress */ /* pointer / tilt, -1..1 */
  const place = (el, k, c, W, H) => {
    const [ks, kx, ry] = KS[k];
    const x = -c.x * .09 * W * kx - pm.x * 22 * kx, y = -(c.t * ry) - c.y * H * .14 * kx - pm.y * 12 * kx + inert * .75 * kx;
    el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${(1 + (c.z - 1) * ks).toFixed(4)})`; return y;
  };
  const light = (c) => {
    let i = 0; while (i < pal.length - 2 && c.t > pal[i + 1][0]) i++; const a = pal[i], b = pal[i + 1], k = clamp((c.t - a[0]) / (b[0] - a[0]), 0, 1);
    const top = mixc(hex(a[1]), hex(b[1]), k), bot = mixc(hex(a[2]), hex(b[2]), k), tn = mixc(a[3], b[3], k), hz = mixc(a[4], b[4], k), sc = mixc(hex(a[5]), hex(b[5]), k);
    sky.style.background = `linear-gradient(180deg, ${rgb(top)} 0%, ${rgb(bot)} 78%)`;
    tint.style.background = rgb(tn, tn[3]);
    const hz1 = `linear-gradient(180deg, transparent, ${rgb(hz, hz[3] * .5)} 70%, transparent)`; h1.style.background = hz1; h2.style.background = `linear-gradient(180deg, transparent, ${rgb(hz, hz[3] * .4)} 70%, transparent)`;
    const W = innerWidth, H = innerHeight, t = c.t, moon = t >= .62, u = moon ? (t - .62) / .38 : t / .62;
    const px = moon ? W * (.2 + .6 * u) : W * (.12 + .74 * u), py = moon ? H * (.3 - .16 * Math.sin(Math.PI * u)) : H * (.5 - .3 * Math.sin(Math.PI * u) + .06);
    const day = root.getAttribute('data-theme') === 'light';
    sun.style.transform = `translate3d(${(px - pm.x * 9).toFixed(0)}px,${(py - pm.y * 5 + inert * .2).toFixed(0)}px,0)`;
    sun.style.background = moon ? `radial-gradient(circle, ${rgb(sc, .95)} 0 16%, ${rgb(sc, .22)} 17%, transparent 66%)` : `radial-gradient(circle, ${rgb(sc, day ? .95 : .7)} 0 18%, ${rgb(sc, day ? .35 : .22)} 19%, transparent 68%)`;
    stars.style.opacity = (sm((t - .55) / .3) * (day ? .45 : 1)).toFixed(2);
  };

  /* ---------- drifting leaves + scroll whoosh ---------- */
  const f = fx.getContext('2d'); let FW = 0, FH = 0; const leaves = [];
  const sizeFx = () => { FW = innerWidth; FH = innerHeight; fx.width = FW; fx.height = FH; const n = mobile() ? 12 : 30; const r = rng(3); leaves.length = 0; for (let i = 0; i < n; i++) leaves.push({ x: r() * FW, y: r() * FH, z: .45 + r() * 1.35, s: 3 + r() * 4.5, a: r() * 6.28, va: (r() - .5) * .04, vy: .25 + r() * .4, ph: r() * 6.28, c: r() }); };
  let scrollV = 0, prevY = scrollY, whoosh = 0;
  const drawFx = (dt, time, c) => {
    f.clearRect(0, 0, FW, FH);
    const day = root.getAttribute('data-theme') === 'light', night = sm((c.t - .6) / .3);
    for (const p of leaves) {
      p.x += (.35 + Math.sin(time * .6 + p.ph) * .35 + scrollV * .015 * p.z) * p.z * (1 + Math.min(2.5, ((window.LiveWeather || {}).wind || 0) / 18)) * dt * 60; p.y += (p.vy * p.z - scrollV * .22 * p.z * p.z) * dt * 60; p.a += p.va * dt * 60;
      if (p.y > FH + 12) { p.y = -12; p.x = Math.random() * FW; } else if (p.y < -14) { p.y = FH + 12; p.x = Math.random() * FW; } if (p.x > FW + 14) p.x = -12; else if (p.x < -14) p.x = FW + 12;
      f.save(); f.translate(p.x, p.y); f.rotate(p.a); const warm = p.c < .5;
      f.fillStyle = day ? (warm ? 'rgba(196,120,58,.55)' : 'rgba(86,140,90,.5)') : (warm ? `rgba(255,${176 - night * 40},${110 - night * 30},${(.5 - night * .25).toFixed(2)})` : `rgba(120,190,150,${(.4 - night * .2).toFixed(2)})`);
      f.globalAlpha = p.z < .9 ? .55 : Math.min(1, .7 + p.z * .2); f.beginPath(); f.ellipse(0, 0, p.s * p.z, p.s * p.z * .45, 0, 0, 6.283); f.fill(); f.restore();
    }
    if (whoosh > .02) { f.strokeStyle = day ? `rgba(255,255,255,${(whoosh * .5).toFixed(2)})` : `rgba(190,210,255,${(whoosh * .28).toFixed(2)})`; f.lineWidth = 1.2; const dir = scrollV > 0 ? 1 : -1; for (let i = 0; i < 14; i++) { const y = (i * 97 + time * 340 * dir) % FH, yy = y < 0 ? y + FH : y, x = (i * 211) % FW, len = 90 + (i % 5) * 50; f.beginPath(); f.moveTo(x, yy); f.lineTo(x + len * .3, yy - len * dir); f.stroke(); } }
  };

  /* ---------- loop ---------- */
  let lightT = -1, tick = 0, lastT = performance.now(), time = 0, W = innerWidth, H = innerHeight;
  const apply = () => {
    const yf = place(far, 'far', cur, W, H), ym = place(mid, 'mid', cur, W, H); place(near, 'near', cur, W, H);
    /* haze bands ride with the layer they sit on; the sky, stars and sun drift opposite, slowest of all */
    h1.style.transform = `translate3d(0,${yf.toFixed(1)}px,0)`; h2.style.transform = `translate3d(0,${ym.toFixed(1)}px,0)`;
    stars.style.transform = `translate3d(${(-pm.x * 6 - cur.x * 10).toFixed(1)}px,${(-prog * 36 - pm.y * 4 + inert * .12).toFixed(1)}px,0)`;
    if (Math.abs(cur.t - lightT) > .004 || last.t < 0) { light(cur); lightT = cur.t; } /* the sky/tint repaint is the costly part: only when the light really changed */
    if (window.Landscape) window.Landscape.afterApply.forEach((fn) => fn());
    lpm.x = pm.x; lpm.y = pm.y; linert = inert; last.z = cur.z; last.x = cur.x; last.y = cur.y; last.t = cur.t;
  };
  let fxCleared = false;
  const frame = (now) => {
    const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; time += dt;
    const sy = scrollY; scrollV = lerp(scrollV, clamp((sy - prevY) / Math.max(dt, .001) / 60, -60, 60), .2); prevY = sy; whoosh = lerp(whoosh, clamp((Math.abs(scrollV) - 14) / 40, 0, 1), .15);
    const tg = shotAt(sy), kk = 1 - Math.pow(.001, dt); cur.z = lerp(cur.z, tg.z, kk * .5); cur.x = lerp(cur.x, tg.x, kk * .5); cur.y = lerp(cur.y, tg.y, kk * .5); cur.t = lerp(cur.t, tg.t, kk * .5);
    const Mo = window.Motion || {}; if (Mo.off) { pm.tx = 0; pm.ty = 0; } pm.x = lerp(pm.x, pm.tx, .07); pm.y = lerp(pm.y, pm.ty, .07);
    inert = lerp(inert, Mo.off ? 0 : clamp(scrollV, -45, 45), .1); prog = clamp(sy / Math.max(1, docH - innerHeight), 0, 1);
    if (Math.abs(inert - linert) > .05 || Math.abs(pm.x - lpm.x) + Math.abs(pm.y - lpm.y) > .002 || Math.abs(cur.z - last.z) + Math.abs(cur.x - last.x) + Math.abs(cur.y - last.y) + Math.abs(cur.t - last.t) > .0004) apply();
    const M = window.Motion || {};
    if (M.off || M.lite) { if (!fxCleared) { f.clearRect(0, 0, FW, FH); fxCleared = true; } } else { fxCleared = false; if ((tick++ & 1) === 0) drawFx(dt * 2, time, cur); } /* leaves at 30fps */
    requestAnimationFrame(frame);
  };

  /* cursor (desktop) and device tilt (phones) nudge the layers by different amounts */
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; pm.tx = (e.clientX / innerWidth - .5) * 2; pm.ty = (e.clientY / innerHeight - .5) * 2; }, { passive: true });
  document.addEventListener('mouseleave', () => { pm.tx = 0; pm.ty = 0; });
  let tiltBase = null;
  const onTilt = (e) => { if (e.gamma == null) return; if (!tiltBase) tiltBase = { b: e.beta || 0 }; pm.tx = clamp(e.gamma / 22, -1, 1); pm.ty = clamp(((e.beta || 0) - tiltBase.b) / 22, -1, 1); };
  if ('ondeviceorientation' in window && matchMedia('(pointer: coarse)').matches) {
    const DO = window.DeviceOrientationEvent;
    if (DO && typeof DO.requestPermission === 'function') addEventListener('pointerdown', () => DO.requestPermission().then((r) => { if (r === 'granted') addEventListener('deviceorientation', onTilt); }).catch(() => {}), { once: true });
    else addEventListener('deviceorientation', onTilt);
  }

  build(); sizeFx(); measure(); themePal();
  const first = shotAt(scrollY); Object.assign(cur, first); apply();
  new MutationObserver(themePal).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { W = innerWidth; H = innerHeight; build(); sizeFx(); measure(); last.t = -1; paintLayers(); apply(); }, 200); });
  setInterval(measure, 1500);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if (!reduced) requestAnimationFrame(frame);
  window.Landscape = { land, far, mid, near, place, KS, pm, onPaint: [], afterApply: [], get inert() { return inert; }, get prog() { return prog; }, get scrollV() { return scrollV; }, cur, shotAt, measure, get anchors() { return anchors; } };
})();
