/* Skill evidence cards: hover, focus or tap a skill (or a radar axis) to see where it is used on this page.
   Everything is read from the page itself: project cards, Experience, Research, Leadership and Credentials. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const spaced = (el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), out = []; let n; while ((n = w.nextNode())) out.push(n.nodeValue); return out.join(' '); };
  const api = () => window.CareerLab;
  let index = null;

  /* skill name -> { projects: [card...], places: Set(label) } */
  const build = () => {
    const a = api(); if (!a || !a.extractSkills) return null;
    const map = new Map(), get = (k) => { if (!map.has(k)) map.set(k, { projects: [], places: new Set() }); return map.get(k); };
    $$('.project-card').forEach((c) => { a.extractSkills(spaced(c)).forEach((_, k) => { const e = get(k); if (!e.projects.includes(c)) e.projects.push(c); }); });
    [['#exper', 'Experience'], ['#current-work', 'Research'], ['#leadership', 'Leadership'], ['#credentials', 'Credentials']].forEach(([sel, label]) => { const el = $(sel); if (el) a.extractSkills(spaced(el)).forEach((_, k) => get(k).places.add(label)); });
    return map;
  };
  const data = () => index || (index = build());

  /* ---------- the card ---------- */
  const pop = document.createElement('div'); pop.className = 'sk-pop'; pop.setAttribute('role', 'tooltip'); pop.id = 'sk-pop'; pop.hidden = true; document.body.append(pop);
  let target = null, hideT = 0, showT = 0;
  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const projLink = (card) => {
    const b = el('button', 'sk-proj', (card.dataset.projectName || '').trim()); b.type = 'button';
    b.addEventListener('click', () => { hide(); if (window.ProjectDetail) window.ProjectDetail.open(card); else $('#project') && $('#project').scrollIntoView({ behavior: 'smooth' }); });
    return b;
  };
  const projectsBlock = (names) => {
    const m = data(); if (!m) return null; const seen = new Set(), cards = [], places = new Set();
    names.forEach((n) => { const e = m.get(n); if (!e) return; e.projects.forEach((c) => { if (!seen.has(c)) { seen.add(c); cards.push(c); } }); e.places.forEach((p) => places.add(p)); });
    return { cards, places: [...places] };
  };
  const fillSkill = (label, names) => {
    pop.replaceChildren(); pop.append(el('strong', 'sk-h', label));
    const r = projectsBlock(names);
    if (r && r.cards.length) {
      pop.append(el('p', 'sk-sub', r.cards.length === 1 ? 'Used in 1 project' : 'Used in ' + r.cards.length + ' projects'));
      const row = el('div', 'sk-row'); r.cards.forEach((c) => row.append(projLink(c))); pop.append(row);
    } else pop.append(el('p', 'sk-sub', 'Listed as a skill. I have not tagged a project on this page with it.'));
    if (r && r.places.length) pop.append(el('p', 'sk-also', 'Also mentioned in ' + r.places.join(', ')));
  };
  const fillCategory = (cat, ctx) => {
    pop.replaceChildren(); pop.append(el('strong', 'sk-h', cat));
    const a = api(), shown = [];
    ctx.base.skills.forEach((v, name) => { if (ctx.catOf.get(name) === cat && v.strength >= 2) shown.push(name); });
    pop.append(el('p', 'sk-sub', shown.length ? shown.length + ' skill' + (shown.length === 1 ? '' : 's') + ' shown in projects, roles or credentials' : 'Listed, but not yet shown in a project'));
    const m = data();
    shown.slice(0, 7).forEach((name) => {
      const line = el('div', 'sk-line'); line.append(el('b', '', name));
      const e = m && m.get(name); const projs = e ? e.projects.map((c) => c.dataset.projectName) : [];
      line.append(el('span', '', projs.length ? projs.slice(0, 3).join(', ') + (projs.length > 3 ? ' +' + (projs.length - 3) : '') : (e && e.places.size ? [...e.places].join(', ') : 'CV and credentials')));
      pop.append(line);
    });
    if (shown.length > 7) pop.append(el('p', 'sk-also', '+ ' + (shown.length - 7) + ' more'));
  };
  const place = () => {
    const r = target.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, m = 10;
    let x = r.left + r.width / 2 - w / 2; x = Math.max(m, Math.min(innerWidth - w - m, x));
    let y = r.bottom + 10; if (y + h > innerHeight - m && r.top - h - 10 > m) y = r.top - h - 10;
    pop.style.left = x + 'px'; pop.style.top = Math.max(m, y) + 'px';
  };
  const show = (t, fill) => {
    clearTimeout(hideT); target = t; fill(); pop.hidden = false; place(); pop.classList.add('is-on');
    $$('[aria-describedby="sk-pop"]').forEach((n) => n.removeAttribute('aria-describedby')); t.setAttribute('aria-describedby', 'sk-pop');
  };
  function hide() { clearTimeout(showT); pop.classList.remove('is-on'); pop.hidden = true; if (target) target.removeAttribute('aria-describedby'); target = null; }
  const later = () => { clearTimeout(hideT); hideT = setTimeout(hide, 220); };
  pop.addEventListener('pointerenter', () => clearTimeout(hideT)); pop.addEventListener('pointerleave', later);
  addEventListener('scroll', () => { if (!pop.hidden && target) place(); }, { passive: true }); addEventListener('resize', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  document.addEventListener('pointerdown', (e) => { if (!pop.hidden && !pop.contains(e.target) && e.target !== target && !(target && target.contains(e.target))) hide(); });

  /* ---------- wiring ---------- */
  const nameKeys = (txt) => { const a = api(); return a ? [...a.extractSkills(txt).keys()] : []; };
  const skillTriggers = $$('#skills .skilltags span');
  skillTriggers.forEach((t) => {
    t.tabIndex = 0; t.setAttribute('role', 'button'); t.classList.add('sk-trigger');
    const open = () => { const label = t.textContent.trim(); show(t, () => fillSkill(label, nameKeys(label))); };
    t.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch') return; clearTimeout(showT); showT = setTimeout(open, 120); });
    t.addEventListener('pointerleave', (e) => { if (e.pointerType === 'touch') return; clearTimeout(showT); later(); });
    t.addEventListener('focus', open); t.addEventListener('blur', later);
    t.addEventListener('pointerdown', () => { t._was = target === t && !pop.hidden; });
    t.addEventListener('click', () => { if (t._was) { t._was = false; hide(); return; } open(); });
    t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  const wireRadar = (ctx) => {
    $$('.skill-radar .rd-label, .skill-radar .rd-dot').forEach((t) => {
      const cat = t.getAttribute('data-cat'); if (!cat) return; t.style.cursor = 'pointer';
      const open = () => show(t, () => fillCategory(cat, ctx));
      t.addEventListener('pointerenter', (ev) => { if (ev.pointerType !== 'touch') { clearTimeout(showT); showT = setTimeout(open, 120); } });
      t.addEventListener('pointerleave', (ev) => { if (ev.pointerType !== 'touch') { clearTimeout(showT); later(); } });
      t.addEventListener('focus', open); t.addEventListener('blur', later); t.addEventListener('click', open);
      t.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } });
    });
  };
  document.addEventListener('radar-ready', (e) => wireRadar(e.detail));
  if (window.__radarCtx) wireRadar(window.__radarCtx);
})();
