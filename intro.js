/* Welcome intro, played once right after someone passes the entry gate (not on reloads within the same visit).
   1. The name slides in from both sides, glows, lifts; the photo and three lines appear.
   2. A water drop lands: a ripple runs through the name, which breaks into particles.
   3. The particles follow a drifting flow field and re-form the real "Snehankur Mondal" in the hero headline.
   4. Meanwhile the dark overlay is a grid of Conway's Game of Life cells that die off and uncover the site.
   Click or press any key to skip. With reduced motion it is a short static fade. If anything fails, it falls back to a fade. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, root = document.documentElement;
  const NAME = ['SNEHANKUR', 'MONDAL'], LINES = ['MCA · Christ University', 'M.Sc. Physics', 'Software · Data · Scientific computing'];
  const play = (mode) => {
    if (document.getElementById('intro')) return;
    const el = document.createElement('div'); el.id = 'intro'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Welcome'); if (reduced) el.classList.add('reduced');
    let i = 0; const words = NAME.map((w) => `<span class="in-word">${[...w].map((c) => `<span class="in-ch" style="--i:${i};--dir:${i++ % 2 ? 1 : -1}">${c}</span>`).join('')}</span>`).join('');
    el.innerHTML = `<canvas class="in-cover" aria-hidden="true"></canvas><div class="in-glow"></div><div class="in-stage"><p class="in-kicker">${mode === 'owner' ? 'Welcome back' : 'Welcome to the portfolio of'}</p><h1 class="in-name" aria-label="Snehankur Mondal">${words}</h1><figure class="in-photo"><img src="pfpic.jpeg" alt=""><svg viewBox="0 0 150 150" aria-hidden="true"><circle class="in-ring" cx="75" cy="75" r="70"/></svg></figure><ul class="in-lines">${LINES.map((t, k) => `<li style="--k:${k}">${t}</li>`).join('')}</ul></div><canvas class="in-fx" aria-hidden="true"></canvas><p class="in-skip">Click or press any key to skip</p>`;
    document.body.append(el); root.classList.add('intro-on');
    const $ = (s) => el.querySelector(s), heroName = document.querySelector('.hero h1 .name-edit, h1 .name-edit');
    const light = root.getAttribute('data-theme') === 'light', mobile = innerWidth < 700, t0 = performance.now();
    let stage = 'pre', timer = 0, raf = 0;
    const restoreHero = () => { if (heroName) { heroName.style.transition = ''; heroName.style.removeProperty('opacity'); } };
    function end() { cancelAnimationFrame(raf); clearTimeout(timer); restoreHero(); el.remove(); root.classList.remove('intro-on'); removeEventListener('keydown', onKey, true); removeEventListener('pointerdown', onPointer, true); }
    const fade = () => { stage = 'fade'; el.classList.add('fade'); setTimeout(end, 480); };
    function onKey(e) { e.stopImmediatePropagation(); e.preventDefault(); skip(); } /* keys only skip; they never trigger the site's shortcuts */
    function onPointer() { skip(); }
    function skip() { if (stage === 'pre') { clearTimeout(timer); fade(); } else if (stage === 'reveal') end(); }
    addEventListener('keydown', onKey, true); addEventListener('pointerdown', onPointer, true);
    window.PortfolioIntro = { el: () => el, skip };
    if (reduced) { timer = setTimeout(fade, 1800); return; }

    /* ---------- the reveal sequence ---------- */
    const reveal = () => {
      if (stage !== 'pre') return;
      try { runReveal(); } catch (err) { console.warn('intro fallback', err); restoreHero(); fade(); }
    };
    timer = setTimeout(reveal, 4300);

    function runReveal() {
      const W = innerWidth, H = innerHeight, dpr = Math.min(mobile ? 1.5 : 2, devicePixelRatio || 1);
      const fx = $('.in-fx'), cover = $('.in-cover'); [fx, cover].forEach((c) => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); c.style.width = W + 'px'; c.style.height = H + 'px'; });
      const f = fx.getContext('2d'), cc = cover.getContext('2d'); f.setTransform(dpr, 0, 0, dpr, 0, 0); cc.setTransform(dpr, 0, 0, dpr, 0, 0);
      const letters = [...el.querySelectorAll('.in-ch')];
      /* sample text into points: source = the intro letters, target = the real hero headline */
      const off = document.createElement('canvas'); off.width = W; off.height = H; const oc = off.getContext('2d', { willReadFrequently: true });
      const sample = (items, step) => { oc.clearRect(0, 0, W, H); oc.fillStyle = '#000'; oc.textBaseline = 'alphabetic'; items.forEach(({ ch, r, font }) => { oc.font = font; const m = oc.measureText(ch), asc = m.fontBoundingBoxAscent || r.height * .8, des = m.fontBoundingBoxDescent || r.height * .2; oc.fillText(ch, r.left, r.top + (r.height - (asc + des)) / 2 + asc); }); const d = oc.getImageData(0, 0, W, H).data, pts = []; for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 140) pts.push({ x, y }); return pts; };
      const fontOf = (e) => { const c = getComputedStyle(e); return `${c.fontStyle} ${c.fontWeight} ${c.fontSize} ${c.fontFamily}`; };
      const srcItems = letters.map((l) => ({ ch: l.textContent, r: l.getBoundingClientRect(), font: fontOf(l) }));
      const tgtItems = []; if (!heroName || !heroName.firstChild) throw new Error('no hero name');
      const tn = heroName.firstChild, tfont = fontOf(heroName); for (let k = 0; k < tn.textContent.length; k++) { const ch = tn.textContent[k]; if (ch === ' ') continue; const rg = document.createRange(); rg.setStart(tn, k); rg.setEnd(tn, k + 1); tgtItems.push({ ch, r: rg.getBoundingClientRect(), font: tfont }); }
      const N = mobile ? 170 : 420, area = (r) => Math.max(1, Math.round(Math.sqrt(r)));
      const pick = (pts) => { pts.sort((a, b) => a.x - b.x || a.y - b.y); const out = []; for (let k = 0; k < N; k++) out.push(pts[Math.floor(k * pts.length / N)]); return out; };
      let sp = sample(srcItems, 3), tp = sample(tgtItems, 2); if (sp.length < 40 || tp.length < 40) throw new Error('sampling failed');
      sp = pick(sp); tp = pick(tp);
      const rnd = (() => { let s = 17; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
      const ps = sp.map((p, k) => ({ sx: p.x, sy: p.y, tx: tp[k].x, ty: tp[k].y, d: rnd() * .38, dur: 1.5 + rnd() * .5, ph: rnd() * 6.28, amp: (50 + rnd() * 90) * (.5 + Math.min(1, W / 1280) * .6) }));
      /* Game of Life grid over the whole screen */
      const cs = mobile ? 18 : 22, cols = Math.ceil(W / cs), rows = Math.ceil(H / cs), cells = cols * rows;
      let life = new Uint8Array(cells), nxt = new Uint8Array(cells); const cov = new Uint8Array(cells).fill(1), thr = new Float32Array(cells);
      const mx = Math.hypot(cols / 2, rows / 2); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const k = r * cols + c; life[k] = rnd() < .34 ? 1 : 0; thr[k] = .25 + Math.hypot(c - cols / 2, r - rows / 2) / mx * 1.6 + rnd() * .4; }
      const step = () => { for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const rr = r + dy, c2 = c + dx; if (rr >= 0 && rr < rows && c2 >= 0 && c2 < cols) n += life[rr * cols + c2]; } const k = r * cols + c; nxt[k] = life[k] ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0); } [life, nxt] = [nxt, life]; };
      const grad = cc.createRadialGradient(W / 2, H * .45, 0, W / 2, H * .45, Math.hypot(W, H) * .6); if (light) { grad.addColorStop(0, '#f6f8ff'); grad.addColorStop(.6, '#dfe7ff'); grad.addColorStop(1, '#cdd8fb'); } else { grad.addColorStop(0, '#10204a'); grad.addColorStop(.6, '#070d26'); grad.addColorStop(1, '#04081a'); }
      const paintCover = (g, lifeOn) => { cc.clearRect(0, 0, W, H); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const k = r * cols + c; if (cov[k]) { cc.fillStyle = grad; cc.fillRect(c * cs, r * cs, cs + .6, cs + .6); } if (lifeOn && life[k]) { cc.fillStyle = light ? 'rgba(47,91,214,.85)' : 'rgba(94,234,212,.85)'; cc.fillRect(c * cs + 3, r * cs + 3, cs - 6, cs - 6); } } };
      paintCover(false, false); el.style.background = 'transparent'; el.classList.add('breaking');
      stage = 'reveal'; if (heroName) { heroName.style.transition = 'none'; heroName.style.opacity = '0'; }
      /* letters: stop the entrance animation so they can be moved by the ripple */
      letters.forEach((l) => { l.style.animation = 'none'; l.style.opacity = '1'; l.style.transform = 'none'; l.style.filter = 'none'; });
      const ph = $('.in-photo img').getBoundingClientRect(), dx0 = ph.left + ph.width / 2, dy0 = ph.top + ph.height / 2;
      const lc = letters.map((l) => { const r = l.getBoundingClientRect(); return { l, x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      const start = performance.now(); let lastGen = 0, particlesOn = false, landed = false, heroShown = false;
      const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const frame = (now) => { try { frameBody(now); } catch (err) { console.warn('intro frame', err); finishCleanly(); } };
      const frameBody = (now) => {
        const t = (now - start) / 1000; f.clearRect(0, 0, W, H);
        /* a) water drop ripple, 0 to ~1.2s */
        if (t < 1.4) {
          const col = light ? '47,91,214' : '94,234,212';
          if (t < .18) { f.fillStyle = `rgba(${col},${1 - t / .18})`; f.beginPath(); f.arc(dx0, dy0 - 90 + (t / .18) * 90, Math.max(0, 7 * (1 - t / .3)), 0, 6.283); f.fill(); }
          [0, .13, .26].forEach((lag, k) => { const tt = t - lag - .12; if (tt <= 0) return; const R = tt * 820, a = Math.max(0, 1 - tt / 1.2) * (1 - k * .25); f.strokeStyle = `rgba(${col},${(a * .75).toFixed(3)})`; f.lineWidth = 3 - k * .8; f.beginPath(); f.arc(dx0, dy0, R, 0, 6.283); f.stroke(); f.strokeStyle = `rgba(255,255,255,${(a * .18).toFixed(3)})`; f.lineWidth = 9; f.beginPath(); f.arc(dx0, dy0, Math.max(0, R - 6), 0, 6.283); f.stroke(); });
          if (!particlesOn) lc.forEach(({ l, x, y }) => { const d = Math.hypot(x - dx0, y - dy0); let ox = 0, oy = 0, sc = 1; [0, .13, .26].forEach((lag, k) => { const tt = t - lag - .12; if (tt <= 0) return; const dd = d - tt * 820, g = Math.exp(-(dd * dd) / (2 * 38 * 38)) * Math.max(0, 1 - tt / 1.2); const ang = Math.atan2(y - dy0, x - dx0); ox += Math.cos(ang) * g * 16; oy += Math.sin(ang) * g * 16; sc += g * .14; }); l.style.transform = `translate(${ox.toFixed(1)}px,${oy.toFixed(1)}px) scale(${sc.toFixed(3)})`; });
        }
        /* b) break into particles at ~.8s and fly along the flow field to the headline */
        if (t >= .8 && !particlesOn) { particlesOn = true; letters.forEach((l) => { l.style.opacity = '0'; }); }
        if (particlesOn) {
          const ft = t - .8; let done = 0; f.globalCompositeOperation = light ? 'source-over' : 'lighter';
          const fade = landed ? Math.max(0, 1 - (t - landed) / .5) : 1;
          ps.forEach((p) => {
            const k = Math.max(0, Math.min(1, (ft - p.d) / p.dur)), e = ease(k); if (k >= 1) done++;
            const bx = p.sx + (p.tx - p.sx) * e, by = p.sy + (p.ty - p.sy) * e, w = Math.sin(Math.PI * k) * p.amp, ang = Math.sin(by * .011 + ft * 1.7 + p.ph) * 3.1 + Math.cos(bx * .009 - ft * 1.3) * 2.2;
            const x = bx + Math.cos(ang) * w, y = by + Math.sin(ang) * w, u = Math.max(0, Math.min(1, bx / W));
            const r = light ? 40 + u * 80 : 94 + u * 70, g = light ? 90 + u * 10 : 234 - u * 120, b = light ? 214 : 212 + u * 43;
            f.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${(.16 * fade).toFixed(3)})`; f.beginPath(); f.arc(x, y, mobile ? 4 : 5, 0, 6.283); f.fill();
            f.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${(.95 * fade).toFixed(3)})`; f.beginPath(); f.arc(x, y, mobile ? 1.5 : 1.9, 0, 6.283); f.fill();
          });
          f.globalCompositeOperation = 'source-over';
          if (!landed && done === ps.length) { landed = t; }
          if (landed && !heroShown) { heroShown = true; if (heroName) { heroName.style.transition = 'opacity .6s ease'; heroName.style.opacity = '1'; } }
        }
        /* c) Game of Life cover dissolves from ~1s, centre outwards */
        const lt = t - 1; if (lt > 0) {
          if (now - lastGen > 105) { lastGen = now; step(); }
          let any = 0; for (let k = 0; k < cells; k++) if (cov[k]) { if (lt > thr[k] && (!life[k] || lt > thr[k] + .9)) cov[k] = 0; else any++; }
          paintCover(true, true);
          if (lt > 3.1 && !any) { finishCleanly(); return; }
        }
        if (t > 4.4) { finishCleanly(); return; }
        raf = requestAnimationFrame(frame);
      };
      const finishCleanly = () => { restoreHero(); heroName && (heroName.style.opacity = '1'); setTimeout(() => heroName && heroName.style.removeProperty('opacity'), 700); el.remove(); root.classList.remove('intro-on'); removeEventListener('keydown', onKey, true); removeEventListener('pointerdown', onPointer, true); cancelAnimationFrame(raf); };
      raf = requestAnimationFrame(frame);
    }
  };
  document.addEventListener('portfolio:enter', (e) => play(e.detail && e.detail.mode));
})();
