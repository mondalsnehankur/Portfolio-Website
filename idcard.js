/* ID card hero (idcard.js)
   1. A lanyard with enamel pins (music, travel) and an ID card that dangles: a damped double pendulum,
      draggable, nudged by the cursor, with a slow idle sway.
   2. When you scroll to About the card lifts off the lanyard, flips in mid-air, lands in the About section
      and is scanned: the class diagram is revealed under a scan line, then the About points are read out.
   Scrolling back up returns it to the lanyard. Reduced motion: static card, everything simply visible.
   Edit the pins in PINS below. Without JS the card and the About section render statically. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const root = document.documentElement;
  const rig = $('#id-rig'), card = $('#id-card'), svg = $('#id-strap'), dock = $('#id-dock'), about = $('#about');
  if (!rig || !card || !svg) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && dock) root.classList.add('js-id');

  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.append(e); return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t = clamp(t, 0, 1)) < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ---------- pins: music + travel, on the strap ---------- */
  const PINS = [
    { strap: 0, t: .33, title: 'Music club', hint: 'Headphones on most days. Playlists double as my debugging soundtrack.', svg: '<circle r="12.5" fill="#e9a824" stroke="#b9791a" stroke-width="1.5"/><circle r="10" fill="none" stroke="#fff3c8" stroke-opacity=".55" stroke-width=".8"/><path d="M-6.2 2.2V-.6a6.2 6.2 0 0 1 12.4 0V2.2" fill="none" stroke="#2a1a05" stroke-width="1.8" stroke-linecap="round"/><rect x="-8" y="1.2" width="4.2" height="7" rx="1.7" fill="#2a1a05"/><rect x="3.8" y="1.2" width="4.2" height="7" rx="1.7" fill="#2a1a05"/>' },
    { strap: 0, t: .68, title: 'Always travelling', hint: 'Compass first, itinerary second. Base is Delhi NCR, the map is bigger.', svg: '<circle r="12.5" fill="#eaf1ff" stroke="#5877d6" stroke-width="1.6"/><g stroke="#5877d6" stroke-width="1"><path d="M0-11.2V-9M0 9v2.2M-11.2 0H-9M9 0h2.2"/></g><g transform="rotate(38)"><path d="M0-8 2.7 0H-2.7Z" fill="#e5484d"/><path d="M0 8 2.7 0H-2.7Z" fill="#2a3358"/></g><circle r="1.4" fill="#fff" stroke="#2a3358" stroke-width=".7"/>' },
    { strap: 1, t: .42, title: 'Live music', hint: 'Gigs over streams, whenever there is a choice.', svg: '<circle r="12" fill="#1b2750" stroke="#d9b24c" stroke-width="1.6"/><ellipse cx="-2.3" cy="4.6" rx="3" ry="2.2" fill="#f0cd6a" transform="rotate(-20 -2.3 4.6)"/><rect x="0" y="-6.6" width="1.4" height="11.2" fill="#f0cd6a"/><path d="M1.4-6.6C4.4-5.6 6.4-4 5.6-.8 4.8-3 3.4-3.6 1.4-4Z" fill="#f0cd6a"/>' },
    { strap: 1, t: .73, title: 'Next stop: anywhere', hint: 'Always one trip from being planned. That is half the reason LocaLens exists.', svg: '<circle r="12" fill="#35c0ae" stroke="#1d8b7c" stroke-width="1.6"/><path d="M-7.5-.5 7.5-6.5 3.2 7 .4 1.6Z" fill="#fff"/><path d="M.4 1.6 7.5-6.5" stroke="#1d8b7c" stroke-width="1"/>' }
  ];

  /* ---------- strap drawing ---------- */
  let cx = 0, Ls = 200, cw = 262, ch = 400;
  const layout = () => {
    cw = card.offsetWidth; ch = card.offsetHeight; cx = rig.clientWidth / 2;
    Ls = Math.round(clamp(ch * .5, 150, 210));
    rig.style.height = (Ls + ch + 40) + 'px';
  };
  const AY = -8, SPREAD = 64;
  const straps = [0, 1].map(() => ({
    base: el('path', { fill: 'none', stroke: '#26256b', 'stroke-width': 16 }, svg),
    mid: el('path', { fill: 'none', stroke: '#3b3a8f', 'stroke-width': 12 }, svg),
    stitch: el('path', { fill: 'none', stroke: '#ffffff', 'stroke-opacity': .55, 'stroke-width': 1.4, 'stroke-dasharray': '2 5' }, svg)
  }));
  const ring = el('circle', { r: 7, fill: 'none', stroke: '#b7bfd0', 'stroke-width': 3 }, svg);
  const emptyClip = el('g', {}, svg);
  el('rect', { x: -13, y: -3, width: 26, height: 34, rx: 7, fill: '#aab2c4', stroke: '#6c7488', 'stroke-width': 1 }, emptyClip);
  el('rect', { x: -6, y: 15, width: 12, height: 7, rx: 3.5, fill: '#2a2f40' }, emptyClip);
  emptyClip.style.display = 'none';
  const pinEls = PINS.map((p) => {
    const g = el('g', { class: 'pin' }, svg); const inner = el('g', { class: 'pin-in' }, g);
    inner.innerHTML = p.svg; g.setAttribute('tabindex', '0'); g.setAttribute('role', 'img'); g.setAttribute('aria-label', p.title + '. ' + p.hint); return g;
  });
  /* hover / focus / tap tooltip */
  const tip = document.createElement('div'); tip.className = 'pin-tip'; tip.setAttribute('role', 'tooltip'); document.body.append(tip);
  let tipT;
  const showTip = (i) => {
    const r = pinEls[i].getBoundingClientRect(); tip.innerHTML = '<b></b><span></span>'; tip.firstChild.textContent = PINS[i].title; tip.lastChild.textContent = PINS[i].hint;
    const w = 210, x = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)); tip.style.left = x + 'px'; tip.style.top = (r.bottom + 10) + 'px'; tip.classList.add('on'); clearTimeout(tipT);
  };
  const hideTip = () => { tip.classList.remove('on'); clearTimeout(tipT); };
  pinEls.forEach((g, i) => {
    g.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') showTip(i); });
    g.addEventListener('pointerleave', hideTip); g.addEventListener('focus', () => showTip(i)); g.addEventListener('blur', hideTip);
    g.addEventListener('click', (e) => { e.stopPropagation(); showTip(i); tipT = setTimeout(hideTip, 2600); });
    g.addEventListener('pointerdown', (e) => e.stopPropagation());
  });
  addEventListener('scroll', hideTip, { passive: true });

  /* ---------- physics ---------- */
  let th = 0.22, thv = 0, ph = 0, phv = 0, ry = 0, time = 0, dragging = false, thT = 0, visible = true, last = performance.now();
  let Cx = 0, Cy = 0;
  const render = () => {
    Cx = cx + Ls * Math.sin(th); Cy = AY + Ls * Math.cos(th);
    const A = [[cx - SPREAD, AY], [cx + SPREAD, AY]];
    straps.forEach((s, i) => {
      const d = `M${A[i][0]} ${A[i][1]}L${Cx.toFixed(1)} ${Cy.toFixed(1)}`;
      s.base.setAttribute('d', d); s.mid.setAttribute('d', d); s.stitch.setAttribute('d', d);
    });
    ring.setAttribute('cx', Cx.toFixed(1)); ring.setAttribute('cy', Cy.toFixed(1));
    emptyClip.setAttribute('transform', `translate(${Cx.toFixed(1)} ${Cy.toFixed(1)}) rotate(${(ph * 57.3).toFixed(1)})`);
    PINS.forEach((p, i) => {
      const a = A[p.strap], x = lerp(a[0], Cx, p.t), y = lerp(a[1], Cy, p.t);
      const ang = Math.atan2(Cy - a[1], Cx - a[0]) * 57.3 - 90;
      pinEls[i].setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang * .35).toFixed(1)})`);
    });
    card.style.transform = `translate3d(${(Cx - cw / 2).toFixed(1)}px,${(Cy - 3).toFixed(1)}px,0) rotate(${ph.toFixed(4)}rad) perspective(900px) rotateY(${ry.toFixed(1)}deg)`;
    card.style.setProperty('--hx', (50 + ry * 3.5).toFixed(0) + '%');
  };
  const step = (now) => {
    const dt = Math.min(.033, (now - last) / 1000); last = now; time += dt;
    if (visible && dt > 0 && !(window.Motion && window.Motion.off && !dragging)) {
      if (dragging) {
        const prev = th; th += (thT - th) * Math.min(1, dt * 16); thv = clamp((th - prev) / dt, -9, 9) * .8 + thv * .2;
      } else {
        const wind = .3 * Math.sin(time * .9) + .18 * Math.sin(time * 1.7 + 1);
        thv += (-7.2 * Math.sin(th) - .42 * thv + wind) * dt; th += thv * dt;
      }
      phv += (-15 * (ph - th * .9) - 1.5 * phv) * dt; ph += phv * dt;
      const yawT = 7 * Math.sin(time * .8) + clamp(thv * 12, -26, 26);
      ry += (yawT - ry) * Math.min(1, dt * 5);
      render();
    }
    requestAnimationFrame(step);
  };

  layout();
  if (reduced) { th = 0; ph = 0; ry = 0; render(); }
  else {
    render(); requestAnimationFrame(step);
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; last = performance.now(); }, { rootMargin: '120px' }).observe(rig);
  }
  addEventListener('resize', () => { layout(); render(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layout(); render(); });

  if (!reduced) {
    const touched = () => rig.classList.add('touched');
    card.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a')) return;
      dragging = true; card.classList.add('is-drag'); try { card.setPointerCapture(e.pointerId); } catch (_) {} touched(); onMove(e); e.preventDefault();
    });
    const onMove = (e) => {
      if (!dragging) return;
      const r = rig.getBoundingClientRect(); thT = clamp(Math.atan2(e.clientX - r.left - cx, e.clientY - r.top - AY), -1.15, 1.15);
    };
    card.addEventListener('pointermove', onMove);
    const up = () => { if (!dragging) return; dragging = false; card.classList.remove('is-drag'); };
    card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up); card.addEventListener('lostpointercapture', up);
    /* the cursor brushing past gives it a nudge */
    let lx = null;
    document.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      if (lx !== null && !dragging && visible) {
        const r = card.getBoundingClientRect();
        if (e.clientX > r.left - 30 && e.clientX < r.right + 30 && e.clientY > r.top - 10 && e.clientY < r.bottom + 10) {
          thv = clamp(thv + (e.clientX - lx) * .0065, -3.2, 3.2);
          if (Math.abs(e.clientX - lx) > 6) touched();
        }
      }
      lx = e.clientX;
    }, { passive: true });
  }

  /* ---------- flight to the About section and back ---------- */
  if (reduced || !dock || !about) return;
  let state = 'hero', busy = false;
  const stateTxt = $('#idb-state');
  const heroRect = () => { const r = card.getBoundingClientRect(); const w = cw, h = card.offsetHeight; return { w, h, x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const dockRect = () => { const r = dock.getBoundingClientRect(); return { w: r.width, h: r.height, x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  const fly = (toDock) => {
    busy = true;
    const front = $('.idc', card).cloneNode(true);
    const ghost = document.createElement('div'); ghost.className = 'idg'; ghost.setAttribute('aria-hidden', 'true');
    ghost.innerHTML = '<div class="idg-flip"><div class="idg-f"></div><div class="idg-b"></div></div>';
    const fEl = $('.idg-f', ghost), flip = $('.idg-flip', ghost);
    front.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
    fEl.append(front); document.body.append(ghost);
    const natH = front.offsetHeight || ch;
    const startA = toDock ? heroRect() : dockRect();
    const startTilt = ph, dur = 1300, t0 = performance.now();
    if (toDock) { card.classList.add('is-away'); emptyClip.style.display = ''; thv += (Math.random() < .5 ? -1 : 1) * 2.2; }
    else { dock.classList.remove('is-in'); }
    const place = (now) => {
      const s = clamp((now - t0) / dur, 0, 1), e = ease(s);
      const A = toDock ? startA : startA, B = toDock ? dockRect() : heroRect();
      const w = lerp(A.w, B.w, e), h = lerp(A.h, B.h, e), x = lerp(A.x, B.x, e), y = lerp(A.y, B.y, e) - Math.sin(Math.PI * e) * 34;
      ghost.style.width = w + 'px'; ghost.style.height = h + 'px'; ghost.style.transform = `translate3d(${x - w / 2}px,${y - h / 2}px,0)`;
      const sc = w / cw; front.style.transformOrigin = '0 0'; front.style.transform = `scale(${sc})`;
      const ang = toDock ? 180 * e : 180 * (1 - e);
      const tilt = toDock ? startTilt * (1 - e) : startTilt * 0;
      flip.style.transform = `rotateZ(${(tilt * 57.3).toFixed(2)}deg) rotateY(${ang.toFixed(1)}deg)`;
      return s;
    };
    const tick = (now) => {
      const s = place(now);
      if (s < 1) return requestAnimationFrame(tick);
      ghost.remove();
      if (toDock) {
        dock.classList.add('is-in'); state = 'docked';
        if (stateTxt) { stateTxt.textContent = 'scanning…'; setTimeout(() => { stateTxt.innerHTML = 'verified &#10003;'; }, 1700); }
      } else {
        card.classList.remove('is-away'); emptyClip.style.display = 'none'; thv += 1.6; state = 'hero';
      }
      busy = false;
    };
    requestAnimationFrame(tick);
  };

  const check = () => {
    if (busy || root.classList.contains('gated') || $('#intro')) return;
    const vh = innerHeight, r = dock.getBoundingClientRect(), at = about.getBoundingClientRect().top;
    /* the About points are read out as soon as the section is in view (also on phones, where the card sits below them) */
    if (at < vh * .55) about.classList.add('id-in'); else if (at > vh * .98) about.classList.remove('id-in');
    if (state === 'hero' && r.top < vh * .8 && scrollY > 120) fly(true);
    else if (state === 'docked' && (r.top > vh * .98 || scrollY < 40)) fly(false);
  };
  addEventListener('scroll', check, { passive: true }); addEventListener('resize', check);
  setInterval(check, 300);
  /* safety: never leave About hidden if something goes wrong */
  setInterval(() => {
    if (state !== 'docked' && !busy) {
      const r = about.getBoundingClientRect();
      if (r.top < -200 && !about.classList.contains('id-in') && scrollY > 200 && !$('#intro') && !root.classList.contains('gated')) { check(); }
    }
  }, 2500);
  window.IDCard = { fly, check, get state() { return state; } };
})();
