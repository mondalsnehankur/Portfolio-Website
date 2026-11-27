/* Projects: a floating-card carousel under the folder shelf.
   - The cards in .project-grid stay in the page as the data source (and for search / skills), but are hidden once this script runs.
   - The centre card is raised and shows a little more; hovering it expands it; clicking it opens a full-screen, multi-panel overlay.
   - Scrolling over the carousel (down = next, up = previous), dragging, swiping, arrows and keys move it.
   - Clicking a folder plays a short scan across all projects, then the carousel re-forms with the matches.
   Without JS the original cards stay visible. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const grid = $('.project-grid'), shelf = $('.pf-shelf'), explorer = $('.project-explorer');
  if (!grid) return;
  const reducedMq = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reducedMq.matches || !!(window.Motion && window.Motion.off);
  const pad = (n) => String(n).padStart(2, '0');
  const FOLDER_NAMES = { web: ['Web & apps', '#3dd9b0'], data: ['Data & analysis', '#f5b73b'], ml: ['Machine learning', '#a78bfa'], sys: ['Systems & low-level', '#6aa8ff'], sci: ['Scientific computing', '#ff7a90'] };
  const keysOf = (c) => (c.dataset.folders || '').split(/\s+/).filter(Boolean);
  const touchMode = () => matchMedia('(hover: none)').matches || innerWidth < 760;

  const cards = $$('.project-card', grid);
  const caseDetails = $$('.case-study-card');
  const caseFor = (c) => { const k = (c.dataset.projectName || '').toLowerCase().split(' ')[0]; return caseDetails.find((d) => (($('summary strong', d) || {}).textContent || '').toLowerCase().startsWith(k)); };

  /* ---------- images: the cards use lazy / drop-in images, so clones resolve their own source ---------- */
  const loadShot = (img, base) => { const exts = ['webp', 'png', 'jpg', 'jpeg']; let i = 0; const next = () => { if (i < exts.length) img.src = base + '.' + exts[i++]; }; img.addEventListener('error', next); next(); };
  const makeImg = (srcImg, cls) => {
    const img = document.createElement('img'); img.className = cls; img.alt = srcImg.alt || ''; img.decoding = 'async';
    const src = srcImg.getAttribute('src');
    if (src) img.src = src; else if (srcImg.dataset.shot) loadShot(img, srcImg.dataset.shot);
    return img;
  };
  /* a picture for a card: the real image when there is one, otherwise a copy of the illustrated visual (chart, terminal) */
  const makeVisual = (c, cls) => {
    const v = $('.project-visual', c), box = document.createElement('div'); box.className = cls;
    if (!v) return box;
    const im = $('img', v);
    if (im) { box.append(makeImg(im, 'pv-img')); return box; }
    const copy = document.createElement('div'); copy.className = v.className; copy.setAttribute('aria-hidden', 'true');
    [...v.childNodes].forEach((n) => copy.append(n.cloneNode(true)));
    box.append(copy); return box;
  };

  /* ---------- the model ---------- */
  const items = cards.map((c, i) => {
    const numText = (($('.project-number', c) || {}).textContent || '').trim();
    return {
      card: c, i, name: c.dataset.projectName || '', num: numText, n: pad(i + 1),
      title: (($('h3', c) || {}).textContent || c.dataset.projectName || '').trim(),
      keys: keysOf(c), tags: $$('.tech-tags span', c).map((s) => s.textContent.trim()),
      chips: $$('.status-chip', c), paras: $$('.project-body > p', c),
      el: null,
    };
  });
  if (!items.length) return;
  const N = items.length;

  /* ---------- build the carousel ---------- */
  const car = document.createElement('div'); car.className = 'pcar'; car.setAttribute('role', 'region'); car.setAttribute('aria-roledescription', 'carousel'); car.setAttribute('aria-label', 'Projects');
  car.innerHTML = '<div class="pcar-stage" tabindex="0" aria-label="Projects. Use the arrow keys to move, Enter to open."></div>'
    + '<div class="pcar-beam" aria-hidden="true"></div>'
    + '<div class="pcar-bar"><button type="button" class="pcar-nav" data-d="-1" aria-label="Previous project">&#8249;</button><div class="pcar-rail" role="tablist" aria-label="All projects"></div><button type="button" class="pcar-nav" data-d="1" aria-label="Next project">&#8250;</button></div>'
    + '<p class="pcar-meta"><span class="pcar-count" aria-live="polite"></span><span class="pcar-hint">Scroll, drag or use the arrows. Click the centre card for the full picture.</span></p>';
  const stage = $('.pcar-stage', car), rail = $('.pcar-rail', car), countEl = $('.pcar-count', car), beam = $('.pcar-beam', car);

  items.forEach((it) => {
    const el = document.createElement('div'); el.className = 'pci'; el.setAttribute('role', 'group'); el.setAttribute('aria-roledescription', 'slide'); el.setAttribute('aria-label', it.name);
    el.style.setProperty('--pci-hue', ({ web: '#3dd9b0', data: '#f5b73b', ml: '#a78bfa', sys: '#6aa8ff', sci: '#ff7a90' })[it.keys[0]] || '#a78bfa');
    const shot = makeVisual(it.card, 'pci-shot');
    const body = document.createElement('div'); body.className = 'pci-body';
    const top = document.createElement('div'); top.className = 'pci-top';
    const num = document.createElement('span'); num.className = 'pci-num'; num.textContent = it.num; top.append(num);
    it.chips.slice(0, 2).forEach((s) => { const k = s.cloneNode(true); k.classList.add('pci-chip'); top.append(k); });
    const h = document.createElement('h3'); h.className = 'pci-title'; h.textContent = it.title;
    const extra = document.createElement('div'); extra.className = 'pci-extra';
    const inner = document.createElement('div'); inner.className = 'pci-extra-in';
    const desc = document.createElement('p'); desc.className = 'pci-desc'; desc.textContent = (it.paras[0] || {}).textContent || '';
    const tags3 = document.createElement('div'); tags3.className = 'pci-tags'; it.tags.slice(0, 3).forEach((t) => { const s = document.createElement('span'); s.textContent = t; tags3.append(s); });
    inner.append(desc, tags3); extra.append(inner);
    const more = document.createElement('div'); more.className = 'pci-more';
    const moreIn = document.createElement('div'); moreIn.className = 'pci-more-in';
    if (it.tags.length > 3) { const t2 = document.createElement('div'); t2.className = 'pci-tags is-rest'; it.tags.slice(3).forEach((t) => { const s = document.createElement('span'); s.textContent = t; t2.append(s); }); moreIn.append(t2); }
    const cta = document.createElement('span'); cta.className = 'pci-cta'; cta.innerHTML = 'Click to open the full view <i aria-hidden="true">&#8599;</i>'; moreIn.append(cta);
    more.append(moreIn);
    body.append(top, h, extra, more); el.append(shot, body); stage.append(el); it.el = el;
  });
  items.forEach((it, k) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pcr'; b.setAttribute('role', 'tab'); b.dataset.k = k; b.title = it.name; b.setAttribute('aria-label', it.name);
    b.innerHTML = '<b>' + it.n + '</b>'; rail.append(b); it.tile = b;
  });
  const anchor = $('#project-filter-status') && shelf ? $('#project-filter-status') : (shelf || explorer || grid);
  (shelf && !explorer.hidden ? explorer : anchor).after(car);
  grid.classList.add('is-source'); grid.setAttribute('aria-hidden', 'true');

  /* ---------- layout ---------- */
  let vis = items.slice(), index = 0, peek = false, W = 0;
  const SCALE = [1, .88, .78, .7], FADE = [1, .92, .66, .4];
  const layout = () => {
    W = stage.clientWidth; const cw = Math.round(Math.min(430, Math.max(240, W * (W < 560 ? .74 : .5))));
    car.style.setProperty('--cw', cw + 'px');
    items.forEach((it) => {
      const i = vis.indexOf(it), el = it.el;
      if (i < 0) { el.classList.add('is-gone'); el.classList.remove('is-center'); el.style.transform = 'translateX(0) scale(.7)'; el.style.zIndex = 0; el.setAttribute('aria-hidden', 'true'); return; }
      const d = i - index, a = Math.abs(d), s = d === 0 ? 0 : Math.sign(d);
      const x = a === 0 ? 0 : s * cw * (.58 + .42 * (a - 1) * (W < 560 ? .8 : 1)), y = a === 0 ? 0 : 30 + (a - 1) * 16;
      el.classList.remove('is-gone'); el.classList.toggle('is-center', a === 0); el.classList.toggle('is-side', a !== 0);
      el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + SCALE[Math.min(a, 3)] + ')';
      el.style.opacity = a > 3 ? 0 : FADE[a]; el.style.zIndex = 50 - a * 2 + (d < 0 ? 1 : 0); el.style.pointerEvents = a > 3 ? 'none' : '';
      el.setAttribute('aria-hidden', a === 0 ? 'false' : 'true');
    });
    items.forEach((it) => { const i = vis.indexOf(it); it.tile.classList.toggle('is-out', i < 0); it.tile.classList.toggle('is-current', i === index); it.tile.setAttribute('aria-selected', String(i === index)); it.tile.tabIndex = i === index ? 0 : -1; });
    countEl.textContent = vis.length ? (index + 1) + ' / ' + vis.length : '0 / 0';
    car.classList.toggle('is-peek', peek && !!vis.length);
    $$('.pcar-nav', car).forEach((b) => { b.disabled = (+b.dataset.d < 0 && index <= 0) || (+b.dataset.d > 0 && index >= vis.length - 1); });
  };
  const setPeek = (v) => { if (peek === v) return; peek = v && !!vis.length; car.classList.toggle('is-peek', peek); };
  let lastStep = 0;
  const goTo = (i, fromUser) => {
    i = Math.max(0, Math.min(vis.length - 1, i)); if (i === index) return false;
    index = i; peek = false; lastStep = performance.now(); layout(); schedulePeek(); return true;
  };
  const step = (d) => goTo(index + d, true);

  /* ---------- hover to expand (desktop) / tap to expand (touch) ---------- */
  let ptr = null, peekTimer = 0;
  const overCenter = () => { if (!ptr) return false; const c = vis[index] && vis[index].el; if (!c) return false; const r = c.getBoundingClientRect(); return ptr.x >= r.left && ptr.x <= r.right && ptr.y >= r.top && ptr.y <= r.bottom; };
  const updatePeek = () => { if (touchMode() || ov.open) return; setPeek(overCenter()); };
  function schedulePeek() { clearTimeout(peekTimer); peekTimer = setTimeout(updatePeek, calm() ? 30 : 620); }
  stage.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; ptr = { x: e.clientX, y: e.clientY }; if (performance.now() - lastStep > 560) updatePeek(); });
  stage.addEventListener('pointerleave', () => { ptr = null; if (!touchMode()) setPeek(false); });

  /* ---------- moving: wheel, drag, keys, buttons ---------- */
  let lastWheel = 0, usedGesture = false;
  stage.addEventListener('wheel', (e) => {
    if (ov.open) return;
    const dy = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (!dy) return;
    const dir = dy > 0 ? 1 : -1, now = performance.now(), quiet = now - lastWheel > 130; lastWheel = now; if (quiet) usedGesture = false;
    const t = index + dir, canMove = t >= 0 && t < vis.length;
    if (!canMove && now - lastStep > 700) return;           /* at either end the page scrolls on as normal */
    e.preventDefault();
    if (canMove && !usedGesture && now - lastStep > 330 && Math.abs(dy) >= 4) { usedGesture = true; step(dir); }
  }, { passive: false });
  let drag = null, justDragged = false;
  stage.addEventListener('pointerdown', (e) => { if (e.button) return; drag = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId }; });
  stage.addEventListener('pointermove', (e) => { if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x; if (!drag.moved && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(e.clientY - drag.y)) { drag.moved = true; try { stage.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ } } });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x; const was = drag.moved; drag = null;
    if (was) { justDragged = true; setTimeout(() => { justDragged = false; }, 60); if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); }
  };
  stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', () => { drag = null; });
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { if (step(1)) e.preventDefault(); else if (e.key === 'ArrowRight') e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { if (step(-1)) e.preventDefault(); else if (e.key === 'ArrowLeft') e.preventDefault(); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); } else if (e.key === 'End') { e.preventDefault(); goTo(vis.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (vis[index]) openOverlay(vis[index]); }
  });
  car.addEventListener('click', (e) => {
    const nav = e.target.closest('.pcar-nav'); if (nav) { step(+nav.dataset.d); return; }
    const tile = e.target.closest('.pcr'); if (tile) { const it = items[+tile.dataset.k], i = vis.indexOf(it); if (i >= 0) goTo(i); return; }
    const el = e.target.closest('.pci'); if (!el || justDragged) return;
    const it = items.find((x) => x.el === el), i = vis.indexOf(it); if (i < 0) return;
    if (i !== index) { goTo(i); return; }
    if (touchMode() && !peek) { setPeek(true); return; }     /* first tap expands, second opens */
    openOverlay(it, e);
  });
  addEventListener('resize', () => { layout(); });

  /* ---------- the overlay ---------- */
  const ov = { open: false, el: null, from: null, t0: 0, last: null };
  const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const panel = (cls, title, ...kids) => { const p = mk('section', 'pov-p ' + cls); if (title) p.append(mk('h4', 'pov-h', title)); kids.forEach((k) => k && p.append(k)); return p; };
  const normHref = (h) => { try { return new URL(h, location.href).href; } catch (_) { return h; } };

  const buildOverlay = (it) => {
    const c = it.card, root = mk('div', 'pov'); root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', it.title + ': project details'); root.tabIndex = -1;
    const wrap = mk('div', 'pov-grid');
    /* head */
    const head = mk('header', 'pov-p pov-head'); head.append(mk('span', 'pov-kicker', it.num));
    const h2 = mk('h2', 'pov-title'); h2.textContent = it.title; head.append(h2);
    const chips = mk('div', 'pov-chips'); it.chips.forEach((s) => chips.append(s.cloneNode(true))); if (chips.children.length) head.append(chips);
    const x = mk('button', 'pov-x', '&times;'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); head.append(x);
    const parts = { head }, order = [];
    /* screenshot */
    if ($('.project-visual', c)) parts.shot = panel('pov-pshot', '', makeVisual(c, 'pov-shot'));
    /* about */
    const about = mk('div', 'pov-text'); it.paras.forEach((p) => about.append(p.cloneNode(true)));
    if (about.children.length) parts.about = panel('pov-pabout', 'About', about);
    /* skills + folders */
    const skills = mk('div', 'pov-skills'); const tg = mk('div', 'pov-tags'); it.tags.forEach((t) => { const sp = mk('span'); sp.textContent = t; tg.append(sp); });
    if (it.tags.length) skills.append(tg);
    const ks = it.keys.filter((k) => FOLDER_NAMES[k]);
    if (ks.length) { const f = mk('p', 'pov-folders', 'Filed under '); ks.forEach((k) => { const i = mk('i'); i.textContent = FOLDER_NAMES[k][0]; i.style.setProperty('--pf', FOLDER_NAMES[k][1]); f.append(i); }); skills.append(f); }
    if (skills.children.length) parts.skills = panel('pov-pskills', 'Skills and tools', skills);
    /* case study paragraphs, one panel each */
    const cs = caseFor(c), cases = [];
    if (cs) $$('.case-study-content > p', cs).forEach((p) => {
      const cp = p.cloneNode(true), st = $('strong', cp); const label = st ? st.textContent.trim() : ''; if (st) { st.remove(); const br = $('br', cp); if (br) br.remove(); }
      if (cp.textContent.trim()) cases.push(panel('pov-pcase', label || 'Notes', cp));
    });
    /* links */
    const seen = new Set(), links = mk('div', 'pov-links');
    const addLink = (a) => { const h = a.getAttribute('href'); if (!h || seen.has(normHref(h))) return; seen.add(normHref(h)); const l = a.cloneNode(true); l.className = 'pov-link' + (a.classList.contains('bakeverse-options-trigger') ? ' bakeverse-options-trigger' : ''); links.append(l); };
    $$('.project-body a.project-link', c).forEach(addLink);
    if (cs) $$('.case-study-links a', cs).forEach(addLink);
    $$('.project-body span.project-link', c).forEach((s) => links.append(mk('span', 'pov-note', s.textContent.trim())));
    const linkPanel = links.children.length ? panel('pov-plinks', 'Links', links) : null;

    const rest = [...cases, linkPanel].filter(Boolean);
    const top = [parts.shot, parts.about, parts.skills].filter(Boolean);
    wrap.append(head);
    if (parts.shot) { parts.shot.style.cssText = 'grid-column: span 5; grid-row: span 2'; if (parts.about) parts.about.style.cssText = 'grid-column: span 7'; if (parts.skills) parts.skills.style.cssText = 'grid-column: span 7'; if (!parts.about && parts.skills) parts.skills.style.cssText = 'grid-column: span 7; grid-row: span 2'; }
    else { if (parts.about) parts.about.style.cssText = 'grid-column: span ' + (parts.skills ? 7 : 12); if (parts.skills) parts.skills.style.cssText = 'grid-column: span ' + (parts.about ? 5 : 12); }
    top.forEach((p) => wrap.append(p));
    const per = Math.min(4, rest.length) || 1; rest.forEach((p, k) => { const left = rest.length - Math.floor(k / per) * per, inRow = Math.min(per, left); p.style.gridColumn = 'span ' + (12 / inRow); wrap.append(p); });
    const hint = mk('p', 'pov-hint', touchMode() ? 'Tap outside the panels, press Esc or use &times; to close' : 'Click, scroll, move the mouse out or press any key to close');
    root.append(wrap, hint);
    top.concat(rest, [head]).forEach((p, k) => p.style.setProperty('--i', k));
    return root;
  };

  let closers = [];
  const openOverlay = (it, ev) => {
    if (ov.open) return;
    ov.open = true; setPeek(false); ov.from = document.activeElement; ov.t0 = performance.now(); ov.last = null;
    const el = buildOverlay(it); ov.el = el;
    const r = it.el.getBoundingClientRect(), ox = ev && ev.clientX ? ev.clientX : r.left + r.width / 2, oy = ev && ev.clientY ? ev.clientY : r.top + r.height / 2;
    el.style.setProperty('--ox', ox + 'px'); el.style.setProperty('--oy', oy + 'px');
    if (calm()) el.classList.add('no-anim');
    document.body.append(el);
    const touch = touchMode(); el.classList.toggle('is-touch', touch); if (touch) document.documentElement.classList.add('pov-lock');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-on')));
    el.focus({ preventScroll: true });

    const grace = () => performance.now() - ov.t0 < 480;
    const on = (t, ev2, fn, o) => { t.addEventListener(ev2, fn, o); closers.push(() => t.removeEventListener(ev2, fn, o)); };
    on(document, 'keydown', (e) => {
      if (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
      if (e.target.closest && e.target.closest('.pov a') && e.key === 'Enter') return;
      if (grace()) return; e.preventDefault(); e.stopPropagation(); closeOverlay();
    }, true);
    on(el, 'click', (e) => {
      const x = e.target.closest('.pov-x'); if (x) { closeOverlay(); return; }
      const t = e.target.closest('.bakeverse-options-trigger');
      if (t) { e.preventDefault(); closeOverlay(); const bv = document.getElementById('bakeverse-options'); if (bv && !bv.open) bv.showModal(); return; }
      if (e.target.closest('a, button')) return;
      if (touch && e.target.closest('.pov-p')) return;
      closeOverlay();
    });
    if (!touch) {
      on(el, 'wheel', (e) => {
        if (grace()) { e.preventDefault(); return; }
        let n = e.target; while (n && n !== el) { if (n.scrollHeight > n.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(n).overflowY)) { const atTop = n.scrollTop <= 0, atEnd = n.scrollTop + n.clientHeight >= n.scrollHeight - 1; if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atEnd)) return; } n = n.parentNode; }
        e.preventDefault(); closeOverlay();
      }, { passive: false });
      on(el, 'pointermove', (e) => {
        if (e.pointerType === 'touch' || grace()) { ov.last = { x: e.clientX, y: e.clientY }; return; }
        if (e.target.closest('.pov-p')) { ov.last = { x: e.clientX, y: e.clientY }; return; }
        const l = ov.last; ov.last = { x: e.clientX, y: e.clientY };
        if (!l || Math.hypot(e.clientX - l.x, e.clientY - l.y) > 3) closeOverlay();
      });
      on(window, 'scroll', () => { if (!grace()) closeOverlay(); }, { passive: true });
    } else {
      on(el, 'pointerdown', (e) => { if (e.target === el || e.target.classList.contains('pov-grid') || e.target.classList.contains('pov-hint')) closeOverlay(); });
    }
  };
  function closeOverlay() {
    if (!ov.open) return; ov.open = false; closers.forEach((f) => f()); closers = [];
    const el = ov.el; ov.el = null; document.documentElement.classList.remove('pov-lock');
    el.classList.remove('is-on'); el.classList.add('is-off');
    const done = () => { el.remove(); }; if (calm() || el.classList.contains('no-anim')) done(); else setTimeout(done, 420);
    if (ov.from && ov.from.focus && document.contains(ov.from)) { try { ov.from.focus({ preventScroll: true }); } catch (_) { /* ignore */ } }
  }

  /* ---------- folders are the filter, with a short scan ---------- */
  let active = null, scanTimers = [], first = true;
  const status = $('#project-filter-status'), pill = $('.project-count');
  const matches = (it, key) => !key || it.keys.includes(key);
  const clearScan = () => { scanTimers.forEach(clearTimeout); scanTimers = []; car.classList.remove('is-scanning'); items.forEach((it) => it.tile.classList.remove('scan-hit', 'scan-miss')); };
  const settle = (key) => { vis = items.filter((it) => matches(it, key)); index = 0; peek = false; layout(); schedulePeek(); };
  const apply = (key) => {
    active = key;
    $$('.pf', shelf || document).forEach((f) => { const k = (($('.pf-btn', f) || { getAttribute: () => '' }).getAttribute('aria-controls') || '').replace('pf-panel-', ''); f.classList.toggle('is-filter', !!key && k === key); });
    const n = items.filter((it) => matches(it, key)).length;
    if (pill) pill.textContent = pad(N) + ' PROJECTS';
    if (status) {
      status.replaceChildren();
      if (key) { status.append('Showing ' + FOLDER_NAMES[key][0] + ' · ' + n + ' project' + (n === 1 ? '' : 's') + ' '); const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Show all'; b.addEventListener('click', () => apply(null)); status.append(b); }
      else status.append('Showing all ' + N + ' projects. Click a folder to filter.');
    }
    clearScan();
    if (first || calm()) { first = false; settle(key); return; }
    /* the scan: a beam sweeps the carousel and the rail, marking the projects that belong */
    const per = 80, total = N * per + 260;
    car.style.setProperty('--scan', total + 'ms'); car.classList.add('is-scanning'); beam.style.animation = 'none'; void beam.offsetWidth; beam.style.animation = '';
    items.forEach((it, k) => { scanTimers.push(setTimeout(() => it.tile.classList.add(matches(it, key) ? 'scan-hit' : 'scan-miss'), 90 + k * per)); });
    scanTimers.push(setTimeout(() => { settle(key); }, total - 80));
    scanTimers.push(setTimeout(() => { clearScan(); }, total + 260));
  };
  if (shelf && explorer) {
    explorer.hidden = true; if (status) { status.classList.add('pf-status'); shelf.after(status); }
    car.remove(); (status || shelf).after(car);
    $$('.pf-btn', shelf).forEach((btn) => btn.addEventListener('click', () => {
      const key = (btn.getAttribute('aria-controls') || '').replace('pf-panel-', ''); if (!FOLDER_NAMES[key]) return;
      apply(active === key ? null : key);
    }));
  }
  apply(null);
  layout();

  /* jump to a project from elsewhere (folder panels): bring it to the centre and flash it */
  const reveal = (c) => {
    const it = items.find((x) => x.card === c); if (!it) return;
    if (vis.indexOf(it) < 0) { clearScan(); active = null; apply(null); settle(null); }
    goTo(vis.indexOf(it)); car.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'center' });
    it.el.classList.remove('pf-flash'); void it.el.offsetWidth; it.el.classList.add('pf-flash'); setTimeout(() => it.el.classList.remove('pf-flash'), 2200);
  };
  window.ProjectDetail = { open: reveal, apply, openOverlay: (c) => { const it = items.find((x) => x.card === c); if (it) openOverlay(it); } };
})();
