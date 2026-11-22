/* Living scene (scene.js): everything that moves in the landscape besides the camera.
   Behind the peaks: clouds at two depths, bird flocks, an aurora at night.
   Between hills: a lake that reflects the hills (with a slow glint), and drifting mist the cursor can push aside.
   In front: rain with a storm patch of the page, fireflies at night, a soft light under the cursor.
   Weather follows the page: a rain shower around Skills/Experience, aurora near Contact (both read the time-of-day value).
   Switched off by the Pause-motion button; lite mode keeps only still clouds. Needs landscape.js. */
(() => {
  const L = window.Landscape; if (!L) return;
  const root = document.documentElement, land = L.land, cur = L.cur;
  const M = () => window.Motion || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, sm = (t) => (t = clamp(t, 0, 1)) * t * (3 - 2 * t);
  const rng = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const mobile = () => innerWidth < 700, isLight = () => root.getAttribute('data-theme') === 'light';

  /* ---------- layers ---------- */
  const mk = (cls) => { const e = document.createElement('canvas'); e.className = cls; return e; };
  const sky2 = mk('ld-sky2'), mist = mk('ld-mist'), front = mk('ld-front');
  const lake = document.createElement('div'); lake.className = 'ld-layer ld-lake'; lake.innerHTML = '<canvas></canvas><div class="ld-glint"></div>';
  land.insertBefore(sky2, land.querySelector('.ld-far'));
  land.insertBefore(lake, L.near); land.insertBefore(mist, L.near);
  land.insertBefore(front, land.querySelector('.ld-tint'));
  const sx = sky2.getContext('2d'), mx = mist.getContext('2d'), fx = front.getContext('2d');
  let W = innerWidth, H = innerHeight;
  const size = () => { W = innerWidth; H = innerHeight; [sky2, mist, front].forEach((c) => { c.width = W; c.height = H; }); staticDone = false; seed(); };

  /* ---------- lake: reflects the mid hills, drawn once per theme/resize ---------- */
  const lakeCv = lake.firstChild, glint = lake.lastChild;
  const paintLake = () => {
    const m = L.mid, mc = m._cv; if (!mc) return;
    const VH = innerHeight, Hm = parseFloat(m.style.height), w = mc.width / m._dpr;
    lake.style.height = Hm + 'px'; lakeCv.width = mc.width; lakeCv.height = mc.height;
    const c = lakeCv.getContext('2d'); c.setTransform(m._dpr, 0, 0, m._dpr, 0, 0); c.clearRect(0, 0, w, Hm);
    const yl = Hm - 140 - VH * .17, bh = VH * .11, g = c.createLinearGradient(0, yl, 0, yl + bh);
    if (isLight()) { g.addColorStop(0, 'rgba(150,190,225,0)'); g.addColorStop(.14, 'rgba(150,192,226,.92)'); g.addColorStop(1, 'rgba(98,146,188,.97)'); }
    else { g.addColorStop(0, 'rgba(40,64,120,0)'); g.addColorStop(.14, 'rgba(34,56,108,.92)'); g.addColorStop(1, 'rgba(8,14,38,.97)'); }
    c.save(); c.beginPath(); c.rect(0, yl, w, bh); c.clip(); c.fillStyle = g; c.fillRect(0, yl, w, bh);
    c.globalAlpha = .5; c.translate(0, 2 * yl); c.scale(1, -1); c.drawImage(mc, 0, 0, w, Hm); c.restore(); /* mirrored hills */
    glint.style.top = yl + 'px'; glint.style.height = bh + 'px';
  };
  L.onPaint.push(paintLake);
  L.afterApply.push(() => { L.place(lake, 'mid', cur, innerWidth, innerHeight); L.place(mist, 'mid', cur, innerWidth, innerHeight); });

  /* ---------- clouds ---------- */
  const sprites = [];
  for (let i = 0; i < 4; i++) { /* flat-bottomed cumulus: crisp puffs, shaded underneath */
    const w = 380 + i * 60, h = 150, base = h * .8, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), r = rng(i * 7 + 3);
    if ('filter' in g) g.filter = 'blur(1.2px)';
    g.save(); g.beginPath(); g.rect(0, 0, w, base); g.clip(); g.fillStyle = '#fff'; g.beginPath();
    for (let cx = 46; cx < w - 40; cx += 22 + r() * 26) { const fall = 1 - Math.abs(cx - w / 2) / (w * .62), rad = (22 + r() * 24) * (.55 + fall * .7); g.moveTo(cx + rad, base - rad * .62); g.arc(cx, base - rad * .62, rad, 0, 6.283); }
    g.fill(); g.restore();
    g.globalCompositeOperation = 'source-atop'; const sh = g.createLinearGradient(0, base - 70, 0, base); sh.addColorStop(0, 'rgba(120,135,190,0)'); sh.addColorStop(1, 'rgba(120,135,190,.5)'); g.fillStyle = sh; g.fillRect(0, 0, w, h);
    sprites.push(c);
  }
  let clouds = [], drops = [], flies = [], blobs = [], flocks = [], staticDone = false;
  const seed = () => {
    const r = rng(41), n = mobile() ? 5 : 9;
    clouds = Array.from({ length: n }, (_, i) => ({ s: sprites[i % 4], x: r() * (W + 400) - 200, f: r(), z: .45 + r() * .75, sp: 3 + r() * 7 }));
    flakes = Array.from({ length: mobile() ? 40 : 90 }, () => ({ x: r() * W, y: r() * H, r: 1 + r() * 1.8, v: 35 + r() * 55, ph: r() * 6.28 }));
    drops = Array.from({ length: mobile() ? 45 : 110 }, () => ({ x: r() * W, y: r() * H, l: 12 + r() * 18, v: 700 + r() * 400 }));
    flies = Array.from({ length: mobile() ? 9 : 22 }, () => ({ x: r() * W, y: H * (.5 + r() * .45), vx: 0, vy: 0, ph: r() * 6.28 }));
    blobs = Array.from({ length: mobile() ? 4 : 7 }, (_, i) => ({ x: r() * W, y: .6 + r() * .22, w: 420 + r() * 320, h: 70 + r() * 60, v: 5 + r() * 8, a: .09 + r() * .08, ox: 0 }));
  };

  const sunEl = land.querySelector('.ld-sun');
  /* ---------- pointer ---------- */
  const ptr = { x: -999, y: -999, sx: -999, sy: -999, on: false };
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; ptr.x = e.clientX; ptr.y = e.clientY; if (!ptr.on) { ptr.sx = ptr.x; ptr.sy = ptr.y; } ptr.on = true; }, { passive: true });
  document.addEventListener('mouseleave', () => { ptr.on = false; });

  /* ---------- weather from the page position ---------- */
  /* live weather (weather.js) steers clouds, mist, rain, snow and wind; smoothed so a change eases in */
  let rain = 0, snow = 0, cloudK = .4, mistK = 0, flash = 0, nextFlash = 6000, nextBird = 3500, flakes = [];
  const LW = () => window.LiveWeather || {};
  const weather = () => ({ rainT: LW().rain || 0, aur: sm((cur.t - .78) / .12), night: sm((cur.t - .6) / .25) });

  /* ---------- drawing ---------- */
  const drawSky = (dt, time, wx) => {
    const light = isLight(); sx.clearRect(0, 0, W, H);
    if (wx.aur > .02 && !M().lite) { /* aurora ribbons */
      sx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const base = H * (.13 + i * .07), amp = H * (.045 + i * .01), top = [], step = 14;
        for (let x = 0; x <= W + step; x += step) top.push([x, base + Math.sin(x * .004 + time * .22 + i * 2) * amp + Math.sin(x * .011 - time * .37 + i) * H * .014 - L.pm.x * 8 * (i + 1)]);
        const g = sx.createLinearGradient(0, base - amp, 0, base + H * .3); const c1 = i === 1 ? '150,120,255' : '90,255,190';
        g.addColorStop(0, `rgba(${c1},0)`); g.addColorStop(.25, `rgba(${c1},${(wx.aur * (light ? .2 : .3)).toFixed(3)})`); g.addColorStop(1, 'rgba(60,200,230,0)');
        sx.fillStyle = g; sx.beginPath(); top.forEach((p, k) => (k ? sx.lineTo(p[0], p[1]) : sx.moveTo(p[0], p[1]))); for (let k = top.length - 1; k >= 0; k--) sx.lineTo(top[k][0], top[k][1] + H * (.2 + .03 * Math.sin(top[k][0] * .006 + time * .3))); sx.fill();
      }
      sx.globalCompositeOperation = 'source-over';
    }
    const base = (light ? .78 : .42) * (1 - wx.night * .82) * (.5 + cloudK * .8) + rain * .3, wind = 1 + clamp((LW().wind || 0) / 18, 0, 2.5), vis = Math.ceil(clouds.length * clamp(.25 + cloudK * .9, 0, 1));
    for (let ci = 0; ci < vis; ci++) {
      const c = clouds[ci]; c.x += c.sp * c.z * dt * wind; if (c.x > W + 200) c.x = -c.s.width * c.z - 200;
      const sc = .55 + c.z * .75, x = c.x - L.pm.x * 28 * c.z - cur.x * 16 * c.z, y = (.06 + c.f * .36) * H - L.prog * 34 * c.z - L.pm.y * 7 * c.z + L.inert * .15 * c.z;
      sx.globalAlpha = clamp(base * (.5 + c.z * .5), 0, 1); sx.drawImage(c.s, x, y, c.s.width * sc, c.s.height * sc);
    }
    sx.globalAlpha = 1;
    if (!M().lite) { /* birds */
      nextBird -= dt * 1000; if (nextBird < 0 && wx.night < .5 && !document.hidden) { const r = Math.random, dir = r() < .5 ? 1 : -1, n = 5 + (r() * 4 | 0); flocks.push({ dir, x: dir > 0 ? -80 : W + 80, y: H * (.1 + r() * .22), v: 60 + r() * 45, n, s: 4.5 + r() * 3, ph: r() * 6 }); nextBird = 16000 + r() * 22000; }
      sx.lineWidth = 1.4; sx.lineCap = 'round'; sx.strokeStyle = light ? 'rgba(30,40,72,.75)' : 'rgba(255,225,205,.55)'; sx.globalAlpha = 1 - wx.night;
      flocks = flocks.filter((f) => { f.x += f.dir * f.v * dt; f.y += Math.sin(time * .4 + f.ph) * .12;
        for (let k = 0; k < f.n; k++) { const rank = Math.ceil(k / 2), side = k % 2 ? 1 : -1, bx = f.x - f.dir * rank * 15 - L.pm.x * 14, by = f.y + side * rank * 7 - L.prog * 20, wing = Math.sin(time * 8 + k * .8 + f.ph) * .8;
          sx.beginPath(); sx.moveTo(bx - f.s, by - wing * f.s * .8); sx.lineTo(bx, by); sx.lineTo(bx + f.s, by - wing * f.s * .8); sx.stroke(); }
        return f.dir > 0 ? f.x < W + 160 : f.x > -160; });
      sx.globalAlpha = 1;
    }
  };
  const drawMist = (dt, wx) => {
    mx.clearRect(0, 0, W, H); const light = isLight(), col = light ? '255,255,255' : '150,172,230', k = (light ? 1 : .75) * (1 - wx.night * .45) * (1 + rain * .8 + mistK * 3.2);
    for (const b of blobs) {
      b.x += b.v * dt; if (b.x - b.w / 2 > W + 100) b.x = -b.w / 2 - 100;
      if (ptr.on) { const dx = b.x + b.ox - ptr.sx, dy = b.y * H - ptr.sy; if (Math.abs(dy) < b.h * 2.4 + 80 && Math.abs(dx) < b.w * .6 + 120) b.ox += Math.sign(dx || 1) * (1 - Math.abs(dx) / (b.w * .6 + 120)) * 150 * dt; }
      b.ox *= Math.pow(.35, dt);
      const x = b.x + b.ox, y = b.y * H; mx.save(); mx.translate(x, y); mx.scale(1, b.h / b.w); const g = mx.createRadialGradient(0, 0, 0, 0, 0, b.w / 2);
      g.addColorStop(0, `rgba(${col},${clamp(b.a * k, 0, .62).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); mx.fillStyle = g; mx.beginPath(); mx.arc(0, 0, b.w / 2, 0, 6.283); mx.fill(); mx.restore();
    }
  };
  const drawFront = (dt, time, wx) => {
    fx.clearRect(0, 0, W, H); const light = isLight();
    if (ptr.on) { /* light under the cursor */
      ptr.sx = lerp(ptr.sx, ptr.x, .18); ptr.sy = lerp(ptr.sy, ptr.y, .18);
      const g = fx.createRadialGradient(ptr.sx, ptr.sy, 0, ptr.sx, ptr.sy, 230);
      if (light) { g.addColorStop(0, 'rgba(255,252,240,.30)'); g.addColorStop(1, 'rgba(255,252,240,0)'); } else { g.addColorStop(0, 'rgba(255,214,160,.13)'); g.addColorStop(1, 'rgba(255,214,160,0)'); fx.globalCompositeOperation = 'lighter'; }
      fx.fillStyle = g; fx.fillRect(ptr.sx - 230, ptr.sy - 230, 460, 460); fx.globalCompositeOperation = 'source-over';
    }
    if (wx.night > .05) { /* fireflies that drift toward the cursor */
      fx.globalCompositeOperation = 'lighter';
      for (const f of flies) {
        f.vx += (Math.random() - .5) * .5 * dt * 60; f.vy += (Math.random() - .5) * .5 * dt * 60;
        if (ptr.on) { const dx = ptr.sx - f.x, dy = ptr.sy - f.y, d = Math.hypot(dx, dy); if (d < 240 && d > 30) { f.vx += dx / d * .22 * dt * 60; f.vy += dy / d * .22 * dt * 60; } }
        f.vx = clamp(f.vx * .96, -1.6, 1.6); f.vy = clamp(f.vy * .96, -1.2, 1.2); f.x += f.vx * dt * 60; f.y += f.vy * dt * 60;
        if (f.x < -10) f.x = W + 10; else if (f.x > W + 10) f.x = -10; if (f.y < H * .42) f.vy += .05; else if (f.y > H + 10) f.y = H * .5;
        const a = wx.night * (.35 + .65 * Math.max(0, Math.sin(time * 1.8 + f.ph))), r = 9; const g = fx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
        g.addColorStop(0, `rgba(230,255,160,${a.toFixed(3)})`); g.addColorStop(.3, `rgba(190,255,140,${(a * .35).toFixed(3)})`); g.addColorStop(1, 'rgba(190,255,140,0)'); fx.fillStyle = g; fx.fillRect(f.x - r, f.y - r, r * 2, r * 2);
      }
      fx.globalCompositeOperation = 'source-over';
    }
    if (snow > .03) { /* snow: slow wobbling flakes */
      fx.fillStyle = light ? `rgba(255,255,255,${(snow * .9).toFixed(3)})` : `rgba(235,242,255,${(snow * .75).toFixed(3)})`; fx.beginPath();
      const nf = Math.ceil(flakes.length * snow);
      for (let i = 0; i < nf; i++) { const f = flakes[i]; f.y += f.v * dt; f.x += Math.sin(time * .9 + f.ph) * 22 * dt + (LW().wind || 0) * .5 * dt; if (f.y > H + 6) { f.y = -6; f.x = Math.random() * W; } if (f.x > W + 6) f.x = -6; else if (f.x < -6) f.x = W + 6; fx.moveTo(f.x + f.r, f.y); fx.arc(f.x, f.y, f.r, 0, 6.283); }
      fx.fill();
    }
    if (rain > .03) { /* rain, a darker mood, the odd distant flash */
      fx.fillStyle = `rgba(22,32,58,${(rain * .16).toFixed(3)})`; fx.fillRect(0, 0, W, H);
      if (LW().storm) { nextFlash -= dt * 1000; if (nextFlash < 0) { flash = .5; nextFlash = 7000 + Math.random() * 9000; } }
      if (flash > .01) { fx.fillStyle = `rgba(255,255,255,${(flash * .2).toFixed(3)})`; fx.fillRect(0, 0, W, H); flash *= Math.pow(.02, dt); }
      fx.strokeStyle = light ? `rgba(70,90,130,${(rain * .38).toFixed(3)})` : `rgba(185,205,255,${(rain * .34).toFixed(3)})`; fx.lineWidth = 1; fx.beginPath();
      const slant = .16 + L.scrollV * .004;
      for (const d of drops) { d.y += d.v * dt; d.x += d.v * slant * dt; if (d.y > H + 20) { d.y = -20; d.x = Math.random() * W; } if (d.x > W + 20) d.x -= W + 40; fx.moveTo(d.x, d.y); fx.lineTo(d.x - d.l * slant, d.y - d.l); }
      fx.stroke();
    }
  };

  /* ---------- loop (about 30 fps; still frames when motion is off or the page is in lite mode) ---------- */
  let last = performance.now(), time = 0, acc = 0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(.1, (now - last) / 1000); last = now; if (document.hidden) return;
    const m = M(), still = m.off || m.lite;
    acc += dt; if (acc < 1 / 31 && !still) return; const step = acc; acc = 0;
    const wx = weather(), lw = LW(); rain = lerp(rain, m.off ? 0 : wx.rainT, .04); snow = lerp(snow, m.off ? 0 : (lw.snow || 0), .04); cloudK = lerp(cloudK, lw.loaded ? lw.cloud : .45, .03); mistK = lerp(mistK, lw.mist || 0, .03); sunEl.style.opacity = (1 - cloudK * .55 - mistK * .4).toFixed(2); time += still ? 0 : step;
    if (still) {
      if (!staticDone || Math.abs(cur.t - stillT) > .02) { drawSky(0, 0, wx); mx.clearRect(0, 0, W, H); fx.clearRect(0, 0, W, H); staticDone = true; stillT = cur.t; }
      return;
    }
    staticDone = false; drawSky(step, time, wx); drawMist(step, wx); drawFront(step, time, wx);
  };
  let stillT = -1;
  size(); paintLake(); L.afterApply.forEach((fn) => fn());
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); paintLake(); }, 320); });
  new MutationObserver(() => { staticDone = false; paintLake(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  requestAnimationFrame(frame);
})();
