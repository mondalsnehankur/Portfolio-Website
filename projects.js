/* Projects: the folders are the filter, the cards are a compact index, and a click opens a case-file dialog with the full story.
   Without JS (or if the folders fail to build) the original full-size cards and filter chips stay as they were. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const grid = $('.project-grid'), shelf = $('.pf-shelf'), explorer = $('.project-explorer');
  if (!grid) return;
  const all = $$('.project-card', grid);
  /* featured cards stay in the grid; "also" cards (data-tier="also") move into a slim list below it */
  const also = all.filter((c) => c.dataset.tier === 'also'), cards = all.filter((c) => c.dataset.tier !== 'also').concat(also);
  let alsoBox = null;
  if (also.length) {
    alsoBox = document.createElement('div'); alsoBox.className = 'project-also';
    alsoBox.innerHTML = '<h3 class="pa-head">Also on the bench</h3><div class="pa-list"></div>';
    grid.after(alsoBox); also.forEach((c) => $('.pa-list', alsoBox).append(c));
  }
  const FOLDER_NAMES = { web: ['Web & apps', '#3dd9b0'], data: ['Data & analysis', '#f5b73b'], ml: ['Machine learning', '#a78bfa'], sys: ['Systems & low-level', '#6aa8ff'], sci: ['Scientific computing', '#ff7a90'] };
  const keysOf = (c) => (c.dataset.folders || '').split(/\s+/).filter(Boolean);
  const visibleCards = () => cards.filter((c) => !c.hidden);

  /* ---------- compact index ---------- */
  grid.classList.add('is-compact');
  cards.forEach((c) => {
    const body = $('.project-body', c); if (!body) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pc-more';
    b.innerHTML = 'View details <span aria-hidden="true">&#8599;</span>'; b.setAttribute('aria-label', 'View details: ' + (c.dataset.projectName || ''));
    body.append(b);
  });

  /* ---------- the dialog ---------- */
  const dlg = document.createElement('dialog'); dlg.className = 'project-dialog pd'; dlg.id = 'pd-dialog'; dlg.setAttribute('aria-labelledby', 'pd-title');
  dlg.innerHTML = '<div class="project-dialog-content"><button class="dialog-close" type="button" aria-label="Close project details">&times;</button><div class="pd-top"><p class="section-kicker" id="pd-kicker"></p></div><h2 id="pd-title"></h2><div class="pd-chips" id="pd-chips"></div><div class="pd-grid"><div class="pd-visual" id="pd-visual"></div><div class="pd-text" id="pd-text"></div></div><nav class="pd-nav" aria-label="Browse projects"><button type="button" id="pd-prev">&larr; Previous</button><span class="pd-count" id="pd-count"></span><button type="button" id="pd-next">Next &rarr;</button></nav></div>';
  document.body.append(dlg);
  const caseDetails = $$('.case-study-card');
  const caseFor = (c) => { const k = (c.dataset.projectName || '').toLowerCase().split(' ')[0]; return caseDetails.find((d) => (($('summary strong', d) || {}).textContent || '').toLowerCase().startsWith(k)); };
  let current = null;

  const fill = (c) => {
    current = c;
    const num = ($('.project-number', c) || {}).textContent || '';
    $('#pd-kicker').textContent = 'CASE FILE · ' + num.trim();
    $('#pd-title').textContent = (($('h3', c) || {}).textContent || c.dataset.projectName || '').trim();
    const chips = $('#pd-chips'); chips.replaceChildren(); $$('.status-chip', c).forEach((s) => chips.append(s.cloneNode(true)));
    const vis = $('#pd-visual'); vis.replaceChildren(); const v = $('.project-visual', c); if (v) vis.append(v.cloneNode(true));
    const txt = $('#pd-text'); txt.replaceChildren();
    $$('.project-body > p', c).forEach((p) => txt.append(p.cloneNode(true)));
    const tags = $('.tech-tags', c); if (tags) txt.append(tags.cloneNode(true));
    $$('.project-body > a.project-link, .project-body > span.project-link', c).forEach((l) => txt.append(l.cloneNode(true)));
    const ks = keysOf(c).filter((k) => FOLDER_NAMES[k]);
    if (ks.length) { const al = document.createElement('p'); al.className = 'pd-also'; al.append('Filed under '); ks.forEach((k) => { const i = document.createElement('i'); i.textContent = FOLDER_NAMES[k][0]; i.style.setProperty('--pf', FOLDER_NAMES[k][1]); al.append(i); }); txt.append(al); }
    const cs = caseFor(c);
    if (cs) { const content = $('.case-study-content', cs); if (content) { const box = document.createElement('div'); box.className = 'pd-case'; const h = document.createElement('h4'); h.textContent = 'Case study'; box.append(h, content.cloneNode(true)); txt.append(box); } }
    const list = visibleCards(), i = list.indexOf(c);
    $('#pd-count').textContent = (i + 1) + ' / ' + list.length;
    $('#pd-prev').disabled = i <= 0; $('#pd-next').disabled = i < 0 || i >= list.length - 1;
    dlg.scrollTop = 0;
  };
  const open = (c) => { if (!c) return; fill(c); if (!dlg.open) dlg.showModal(); };
  const step = (d) => { const list = visibleCards(), i = list.indexOf(current) + d; if (i >= 0 && i < list.length) fill(list[i]); };
  $('#pd-prev').addEventListener('click', () => step(-1)); $('#pd-next').addEventListener('click', () => step(1));
  $('.dialog-close', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) { dlg.close(); return; }
    const t = e.target.closest('.bakeverse-options-trigger');
    if (t) { e.preventDefault(); const bv = document.getElementById('bakeverse-options'); dlg.close(); if (bv && !bv.open) bv.showModal(); }
  });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); });

  /* the whole compact card opens the dialog (capture: beats the old per-link handlers) */
  const openFromClick = (e) => {
    const c = e.target.closest('.project-card'); if (!c || !grid.classList.contains('is-compact')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); e.stopPropagation(); open(c);
  };
  grid.addEventListener('click', openFromClick, true);
  if (alsoBox) alsoBox.addEventListener('click', openFromClick, true);
  /* once the dialog has the case studies, the separate case-study list would repeat them */
  if (caseDetails.length) { const cg = $('.case-study-grid'); if (cg) cg.hidden = true; }

  /* ---------- folders are the filter ---------- */
  let active = null;
  const status = $('#project-filter-status');
  const apply = (key) => {
    active = key;
    cards.forEach((c) => { c.hidden = !!key && !keysOf(c).includes(key); });
    if (alsoBox) alsoBox.hidden = also.every((c) => c.hidden);
    $$('.pf', shelf || document).forEach((f) => { const k = ($('.pf-btn', f).getAttribute('aria-controls') || '').replace('pf-panel-', ''); f.classList.toggle('is-filter', !!key && k === key); });
    if (!status) return;
    status.replaceChildren();
    const n = visibleCards().length;
    if (key) {
      status.append('Showing ' + FOLDER_NAMES[key][0] + ' · ' + n + ' project' + (n === 1 ? '' : 's') + ' ');
      const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Show all'; b.addEventListener('click', () => apply(null)); status.append(b);
    } else status.append('Showing all ' + cards.length + ' projects. Click a folder to filter.');
  };
  if (shelf && explorer) {
    explorer.hidden = true; if (status) { status.classList.add('pf-status'); shelf.after(status); }
    $$('.pf-btn', shelf).forEach((btn) => btn.addEventListener('click', () => {
      const key = (btn.getAttribute('aria-controls') || '').replace('pf-panel-', ''); if (!FOLDER_NAMES[key]) return;
      apply(active === key ? null : key);
    }));
    apply(null);
  }
  window.ProjectDetail = { open, apply };
})();
