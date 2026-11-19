/* Extras: (1) hero photo morphs into the About avatar, then into the Projects card as you scroll,
           (2) project folders grouped by skill / tech stack, (3) animated city footer.
   Everything is optional: with JS off, the slots simply show the photo, and the project grid and footer work as before. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;

  /* ---------- 1. photo morph ---------- */
  (() => {
    const hero = $('.profile-frame img'), slotA = $('[data-slot="about"]'), slotP = $('[data-slot="proj"]');
    if (reduced || !hero || !slotA || !slotP) return;
    const ghost = document.createElement('div'); ghost.className = 'morph-ghost'; ghost.setAttribute('aria-hidden', 'true');
    const img = new Image(); img.alt = ''; img.decoding = 'async'; img.src = hero.currentSrc || hero.src; ghost.append(img); document.body.append(ghost);
    root.classList.add('morph-on');
    const lerp = (a, b, t) => a + (b - a) * t, ease = (t) => (t = Math.max(0, Math.min(1, t))) * t * (3 - 2 * t);
    const corners = (el, r) => ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map((c) => { const v = getComputedStyle(el)['border' + c + 'Radius'].split(' ')[0]; return v.endsWith('%') ? parseFloat(v) / 100 * Math.min(r.width, r.height) : parseFloat(v) || 0; });
    let rH, rA, rP, heroFilter, heroPosY = 50;
    const measure = () => { const h = hero.getBoundingClientRect(), a = slotA.getBoundingClientRect(), p = slotP.getBoundingClientRect(); rH = corners(hero, h); rA = corners(slotA, a); rP = corners(slotP, p); const cs = getComputedStyle(hero); heroFilter = cs.filter === 'none' ? '' : cs.filter; heroPosY = parseFloat((cs.objectPosition || '50% 50%').split(' ')[1]) || 50; img.style.filter = heroFilter; };
    let queued = false;
    const frame = () => {
      queued = false;
      const H = hero.getBoundingClientRect(), A = slotA.getBoundingClientRect(), P = slotP.getBoundingClientRect();
      if (!H.width || !A.width || !P.width) { ghost.style.display = 'none'; return; } ghost.style.display = '';
      const s = scrollY, vh = innerHeight, Ad = A.top + s, Pd = P.top + s;
      const sA = Math.max(80, Ad - vh * .42), sP = Math.max(sA + 240, Pd - vh * .42);
      let f, g, fr, gr, t, k;
      if (s < sA) { t = ease(s / sA); f = H; g = A; fr = rH; gr = rA; k = t; }
      else if (s < sP) { t = ease((s - sA) / (sP - sA)); f = A; g = P; fr = rA; gr = rP; k = 1; }
      else { t = 1; f = A; g = P; fr = rA; gr = rP; k = 1; }
      const q = ease(Math.min(1, t * 2.2)); /* shrinks to its small size early, then glides */
      const w = lerp(f.width, g.width, q), h = lerp(f.height, g.height, q);
      const cx = lerp(f.left + f.width / 2, g.left + g.width / 2, t), cy = lerp(f.top + f.height / 2, g.top + g.height / 2, t);
      ghost.style.width = w + 'px'; ghost.style.height = h + 'px'; ghost.style.transform = `translate3d(${cx - w / 2}px,${cy - h / 2}px,0)`;
      ghost.style.borderRadius = fr.map((v, i) => lerp(v, gr[i], q).toFixed(1) + 'px').join(' ');
      ghost.style.setProperty('--ring', (s < sA ? k : 1).toFixed(2)); img.style.objectPosition = `50% ${lerp(heroPosY, 24, s < sA ? q : 1).toFixed(1)}%`;
      const bottom = cy + h / 2, top = cy - h / 2; ghost.style.visibility = bottom < -20 || top > vh + 20 ? 'hidden' : 'visible';
    };
    const need = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
    addEventListener('scroll', need, { passive: true }); addEventListener('resize', () => { measure(); need(); });
    new ResizeObserver(() => { measure(); need(); }).observe(document.body);
    img.addEventListener('load', need); measure(); need();
    window.MorphPhoto = { frame };
  })();

  /* ---------- 2. project folders ---------- */
  (() => {
    const cards = $$('.project-grid .project-card[data-folders]'), explorer = $('.project-explorer');
    if (!cards.length || !explorer) return;
    const INK = '#0a1020';
    const ART = {
      web: `<svg class="pf-art" viewBox="0 0 100 80" aria-hidden="true"><rect x="6" y="8" width="80" height="58" rx="6" class="a-fill a-line"/><line x1="6" y1="21" x2="86" y2="21" class="a-line"/><circle cx="13" cy="14.5" r="2" class="a-solid"/><circle cx="20" cy="14.5" r="2" class="a-solid"/><circle cx="27" cy="14.5" r="2" class="a-solid"/><rect x="14" y="29" width="34" height="6" rx="2" class="a-solid"/><rect x="14" y="40" width="50" height="4" rx="2" class="a-soft"/><rect x="14" y="48" width="38" height="4" rx="2" class="a-soft"/><rect x="54" y="29" width="24" height="15" rx="3" class="a-line a-fill"/><rect class="a-caret" x="50" y="28" width="2" height="8"/><g class="a-cursor"><path d="M66 46 L66 66 L71.5 61 L75.5 71 L79 69.5 L75 59.5 L82 59.5Z" class="a-solid"/></g></svg>`,
      data: `<svg class="pf-art" viewBox="0 0 100 80" aria-hidden="true"><line x1="8" y1="68" x2="94" y2="68" class="a-line"/><line x1="8" y1="10" x2="8" y2="68" class="a-line"/>${[[16, 22], [34, 34], [52, 28], [70, 46], [88, 38]].map(([x, h], i) => `<rect class="a-bar" style="--i:${i}" x="${x - 6}" y="${68 - h}" width="12" height="${h}" rx="2"/>`).join('')}<polyline class="a-trend" points="16,50 34,38 52,44 70,24 88,30" /><circle class="a-dot" cx="70" cy="24" r="3"/><circle class="a-dot" cx="88" cy="30" r="3"/></svg>`,
      ml: `<svg class="pf-art" viewBox="0 0 100 80" aria-hidden="true">${(() => { const L = [[18, [20, 40, 60]], [50, [12, 30, 48, 66]], [82, [28, 52]]]; let o = ''; for (let i = 0; i < 2; i++) L[i][1].forEach((y1) => L[i + 1][1].forEach((y2) => { o += `<line class="a-thin" x1="${L[i][0]}" y1="${y1}" x2="${L[i + 1][0]}" y2="${y2}"/>`; })); let k = 0; L.forEach(([x, ys]) => ys.forEach((y) => { o += `<circle class="a-node" style="--i:${k++}" cx="${x}" cy="${y}" r="5"/>`; })); return o; })()}</svg>`,
      sys: `<svg class="pf-art" viewBox="0 0 100 80" aria-hidden="true"><rect x="6" y="8" width="76" height="58" rx="6" class="a-dark"/><path d="M14 22 L20 27 L14 32" class="a-prompt"/><rect x="24" y="25" width="26" height="4" rx="2" class="a-type" style="--i:0"/><rect x="14" y="38" width="48" height="3.5" rx="1.75" class="a-type" style="--i:1"/><rect x="14" y="46" width="36" height="3.5" rx="1.75" class="a-type" style="--i:2"/><rect x="14" y="54" width="14" height="5" rx="1" class="a-caret2"/>${[14, 26, 38, 50].map((y) => `<rect x="82" y="${y}" width="8" height="3" rx="1" class="a-solid"/>`).join('')}</svg>`,
      sci: `<svg class="pf-art" viewBox="0 0 100 80" aria-hidden="true">${[0, 60, 120].map((r, i) => `<g transform="rotate(${r} 50 40)"><ellipse cx="50" cy="40" rx="38" ry="13" class="a-line"/>${reduced ? '' : `<circle r="3.2" class="a-solid"><animateMotion dur="${3 + i * .9}s" repeatCount="indefinite" path="M12 40 a38 13 0 1 0 76 0 a38 13 0 1 0 -76 0"/></circle>`}</g>`).join('')}<circle cx="50" cy="40" r="5.5" class="a-solid"/></svg>`,
    };
    const FOLDERS = [
      { key: 'web', name: 'Web & apps', tab: 'WEB', note: 'where it started', hue: '#3dd9b0', blurb: 'Interactive apps in the browser' },
      { key: 'data', name: 'Data & analysis', tab: 'DATA', note: 'numbers, patiently', hue: '#f5b73b', blurb: 'Python, datasets and reports' },
      { key: 'ml', name: 'Machine learning', tab: 'ML', note: 'teaching machines', hue: '#a78bfa', blurb: 'Models, perception, recommendations' },
      { key: 'sys', name: 'Systems & low-level', tab: 'SYSTEMS', note: 'close to the metal', hue: '#6aa8ff', blurb: 'C, operating systems, mapping' },
      { key: 'sci', name: 'Scientific computing', tab: 'SCIENCE', note: 'physicist at heart', hue: '#ff7a90', blurb: 'Physics and numerical work' },
    ];
    const shelf = document.createElement('div'); shelf.className = 'pf-shelf'; shelf.setAttribute('role', 'group'); shelf.setAttribute('aria-label', 'Project folders by skill or tech stack');
    shelf.innerHTML = '<p class="pf-title"><span>Browse by folder</span><em>A project can live in more than one. Hover, tap or press Enter to open.</em></p><div class="pf-row"></div>';
    const row = $('.pf-row', shelf); explorer.after(shelf);
    const smooth = reduced ? 'auto' : 'smooth';
    const show = (card) => {
      if (card.hidden) $('.project-filter[data-filter="all"]')?.click();
      card.scrollIntoView({ behavior: smooth, block: 'center' }); card.classList.remove('pf-flash'); void card.offsetWidth; card.classList.add('pf-flash'); setTimeout(() => card.classList.remove('pf-flash'), 2200);
    };
    const folders = [];
    FOLDERS.forEach((f) => {
      const items = cards.filter((c) => c.dataset.folders.split(/\s+/).includes(f.key)); if (!items.length) return;
      const el = document.createElement('div'); el.className = 'pf'; el.style.setProperty('--pf', f.hue);
      const pid = 'pf-panel-' + f.key;
      el.innerHTML = `<button type="button" class="pf-btn" aria-expanded="false" aria-controls="${pid}"><span class="pf-back"><span class="pf-tabtext">${f.tab}</span></span><span class="pf-paper p1"></span><span class="pf-paper p2"></span><span class="pf-front"><span class="pf-tape">NO. 0${folders.length + 1}</span>${ART[f.key]}<span class="pf-text"><span class="pf-name">${f.name}</span><span class="pf-note">${f.note}</span><span class="pf-count">${items.length} project${items.length > 1 ? 's' : ''}</span></span></span></button><div class="pf-panel" id="${pid}" role="list" aria-label="${f.name} projects"><p class="pf-blurb">${f.blurb}</p></div>`;
      const panel = $('.pf-panel', el);
      items.forEach((c) => {
        const a = document.createElement('a'); a.href = '#project'; a.className = 'pf-item'; a.setAttribute('role', 'listitem');
        const tags = $$('.tech-tags span', c).slice(0, 3).map((x) => x.textContent.trim()).join(' · ');
        const b = document.createElement('b'); b.textContent = c.dataset.projectName; a.append(b);
        const others = c.dataset.folders.split(/\s+/).filter((k) => k !== f.key).map((k) => FOLDERS.find((x) => x.key === k)?.name).filter(Boolean);
        if (tags) { const sm = document.createElement('small'); sm.textContent = tags; a.append(sm); }
        if (others.length) { const al = document.createElement('i'); al.textContent = 'Also in: ' + others.join(', '); a.append(al); }
        a.addEventListener('click', (e) => { e.preventDefault(); close(); show(c); });
        panel.append(a);
      });
      row.append(el); folders.push(el);
    });
    function close(except) { folders.forEach((f) => { if (f !== except) { f.classList.remove('is-open'); $('.pf-btn', f).setAttribute('aria-expanded', 'false'); } }); }
    folders.forEach((f) => {
      const btn = $('.pf-btn', f);
      btn.addEventListener('click', () => { const open = !f.classList.contains('is-open'); close(f); f.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); });
      const place = () => { const r = f.getBoundingClientRect(); f.classList.toggle('align-right', r.left + 300 > innerWidth - 12 && r.right - 300 > 12); };
      f.addEventListener('pointerenter', place); f.addEventListener('focusin', place);
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.pf')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const o = folders.find((f) => f.classList.contains('is-open')); if (o) { $('.pf-btn', o).focus(); close(); } } });
    window.ProjectFolders = { folders: () => folders.length };
  })();

  /* ---------- 3. city footer: a night street with people walking, cars, a metro train and a waving silhouette of you.
     The scene is rebuilt to the strip's width, so it fills wide screens without stretching. The footer comes after this script, so wait for it. ---------- */
  const buildCity = () => {
    const host = $('#city'); if (!host) return;
    const H = 186, GY = 140; /* GY = kerb line; people's feet sit at GY - 2 */
    let curW = 0, visible = false, svgEl = null;
    const SK = ['#8a5a3c', '#6b4330', '#a77455', '#4f3223'], HAIR = ['#14100e', '#1d1612', '#2a1e17'], JACKET = ['#3c4f93', '#7a2f4a', '#2f6b64', '#8a6a2a', '#54575f', '#4a3a78', '#a04a2c'], PANTS = ['#161d3a', '#202845', '#1a1a24', '#2b2f4a'];
    const pick = (arr, r) => arr[Math.floor(r() * arr.length)];
    const swing = (a, ox, oy, dur, off, mid = 0) => reduced ? '' : `<animateTransform attributeName="transform" type="rotate" values="${mid - a} ${ox} ${oy};${mid + a} ${ox} ${oy};${mid - a} ${ox} ${oy}" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="${dur}s" begin="${off}s" repeatCount="indefinite"/>`;
    const knee = (dur, off) => reduced ? '' : `<animateTransform attributeName="transform" type="rotate" values="4 0 -8.5;10 0 -8.5;22 0 -8.5;42 0 -8.5;4 0 -8.5" keyTimes="0;.25;.5;.75;1" dur="${dur}s" begin="${off}s" repeatCount="indefinite"/>`;
    const leg = (col, shoe, dur, off) => `<g>${swing(26, 0, -17, dur, off)}<path d="M-2.4 -17.5 L2.4 -17.5 L2 -8.5 L-2 -8.5Z" fill="${col}"/><g>${knee(dur, off - dur * .25)}<path d="M-2 -8.7 L2 -8.7 L1.5 -1.2 L-1.5 -1.2Z" fill="${col}"/><path d="M-1.6 -1.4 L3.2 -1.4 Q3.6 0 3 .1 L-1.6 .1Z" fill="${shoe}"/></g></g>`;
    const arm = (col, skin, dur, off) => `<g>${swing(22, 0, -30, dur, off)}<path d="M-1.7 -30.5 L1.7 -30.5 L1.3 -22.5 L-1.3 -22.5Z" fill="${col}"/><g transform="rotate(-16 0 -22.5)"><path d="M-1.3 -22.7 L1.3 -22.7 L1 -15.2 L-1 -15.2Z" fill="${skin}"/><circle cx="0" cy="-14.6" r="1.3" fill="${skin}"/></g></g>`;
    const person = (r, o) => {
      const skin = pick(SK, r), hair = pick(HAIR, r), jack = pick(JACKET, r), pants = pick(PANTS, r), v = Math.floor(r() * 3), g = o.gait, sc = o.h / 40, dim = '#05081a';
      const torso = v === 2 ? `<path d="M-5 -30.5 Q0 -32.5 5 -30.5 L5.4 -11 L-5.4 -11Z" fill="${jack}"/>` : `<path d="M-4.8 -30.5 Q0 -32.5 4.8 -30.5 L4.2 -16.5 Q0 -15.5 -4.2 -16.5Z" fill="${jack}"/>`;
      const bag = v === 0 ? `<rect x="-7.2" y="-30" width="3.6" height="12" rx="1.6" fill="${dim}" opacity=".9"/>` : v === 1 ? `<path d="M-3 -30 L4 -17" stroke="${dim}" stroke-width=".9" fill="none"/><rect x="2.5" y="-18.5" width="5" height="4" rx="1" fill="${dim}"/>` : '';
      const hairShape = v === 1 ? `<path d="M-4 -37 Q-4.8 -31 -3.6 -27.5 L-1 -28.5 L-2.4 -35Z" fill="${hair}"/><path d="M-3.5 -37.5 Q-3 -41.5 .8 -41.5 Q4.4 -41.5 4 -37.2 Q1 -39.2 -3.5 -37.5Z" fill="${hair}"/>` : `<path d="M-3.6 -37.5 Q-3.2 -41.6 .6 -41.6 Q4.2 -41.6 4 -37.6 Q1.2 -39.4 -3.6 -37.5Z" fill="${hair}"/>`;
      return `<g class="walker" style="--x0:${o.x0}px;--dur:${o.dur}s;--delay:${o.delay}s;--from:${o.dir > 0 ? -40 : o.W + 40}px;--to:${o.dir > 0 ? o.W + 40 : -40}px"><g transform="translate(0 ${GY - 2}) scale(${o.dir * sc} ${sc})"><ellipse cx="0" cy="1.2" rx="9" ry="1.6" fill="rgba(0,0,0,.4)"/><g>${reduced ? '' : `<animateTransform attributeName="transform" type="translate" values="0 0;0 -.8;0 0;0 -.8;0 0" dur="${g}s" repeatCount="indefinite"/>`}${arm(jack, skin, g, -g / 2)}${leg(pants, dim, g, -g / 2)}${torso}${bag}<rect x="-1.4" y="-33.4" width="2.8" height="3.4" fill="${skin}"/><ellipse cx=".4" cy="-36.6" rx="3.6" ry="4.3" fill="${skin}"/>${hairShape}${leg(pants, dim, g, 0)}${arm(jack, skin, g, 0)}</g></g></g>`;
    };
    const car = (r, o) => {
      const col = pick(['#2d3b78', '#7b2f3f', '#2b6a62', '#59606e', '#8a7230', '#3a2f5e'], r), w = o.bus ? 92 : 46, y = o.y;
      const body = o.bus ? `<rect x="0" y="-24" width="92" height="26" rx="4" fill="${col}"/>${Array.from({ length: 8 }, (_, i) => `<rect class="win lit" x="${5 + i * 10.5}" y="-20" width="8" height="8" rx="1"/>`).join('')}<rect x="0" y="-8" width="92" height="2" fill="rgba(255,255,255,.25)"/>` : `<path d="M0 0 L0 -5 Q0 -6.6 3 -7 L9 -7.8 L14 -11.4 Q15.5 -12.4 18 -12.4 L30 -12.4 Q33 -12.4 35 -10.2 L39 -7.4 Q44 -7 45.5 -5 L46 0Z" fill="${col}"/><path d="M15.2 -10.4 L18 -10.8 L22 -10.8 L22 -7.6 L12 -7.6Z M24 -10.8 L30 -10.8 Q32 -10.8 33.5 -9.4 L36 -7.6 L24 -7.6Z" fill="#9fb4e8" opacity=".55"/>`;
      const wheel = (cx) => `<g transform="translate(${cx} 1.5)"><circle r="${o.bus ? 4.4 : 3.4}" fill="#05081a"/><circle r="1.5" fill="#6b7aa8"/>${reduced ? '' : `<line x1="-3" y1="0" x2="3" y2="0" stroke="#6b7aa8" stroke-width=".8"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur=".5s" repeatCount="indefinite"/></line>`}</g>`;
      const lights = `<rect x="${w - 2.5}" y="${o.bus ? -6 : -5.5}" width="2.5" height="2" fill="#fff3b8"/><polygon points="${w},${o.bus ? -5 : -4.5} ${w + 46},${o.bus ? 4 : 3} ${w + 46},${o.bus ? -14 : -12}" fill="url(#beam)"/><rect x="0" y="${o.bus ? -6 : -5.5}" width="2" height="2" fill="#ff4b4b"/>`;
      return `<g class="walker" style="--x0:${o.x0}px;--dur:${o.dur}s;--delay:${o.delay}s;--from:${o.dir > 0 ? -140 : o.W + 140}px;--to:${o.dir > 0 ? o.W + 140 : -140}px"><g transform="translate(${o.dir > 0 ? 0 : w} ${y}) scale(${o.dir} 1)"><ellipse cx="${w / 2}" cy="3" rx="${w / 2 + 2}" ry="2" fill="rgba(0,0,0,.4)"/>${body}${wheel(o.bus ? 14 : 10)}${wheel(w - (o.bus ? 14 : 10))}${lights}</g></g>`;
    };
    const render = (W) => {
      let seed = 5; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      let s = `<defs><linearGradient id="gfar" x1="0" y1="0" x2="0" y2="1"><stop class="gf0" offset="0"/><stop class="gf1" offset="1"/></linearGradient><linearGradient id="gnear" x1="0" y1="0" x2="0" y2="1"><stop class="gn0" offset="0"/><stop class="gn1" offset="1"/></linearGradient><linearGradient id="cityhaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf8a" stop-opacity="0"/><stop offset="1" stop-color="#ffcf8a" stop-opacity=".30"/></linearGradient><linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff3b8" stop-opacity=".5"/><stop offset="1" stop-color="#fff3b8" stop-opacity="0"/></linearGradient><radialGradient id="lampg"><stop offset="0" stop-color="#ffe49a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe49a" stop-opacity="0"/></radialGradient><radialGradient id="moong"><stop offset="0" stop-color="#f3ecd3" stop-opacity=".35"/><stop offset="1" stop-color="#f3ecd3" stop-opacity="0"/></radialGradient></defs>`;
      for (let i = 0; i < Math.round(W / 26); i++) s += `<circle class="star" style="animation-delay:${(r() * 5).toFixed(1)}s" cx="${(r() * W).toFixed(0)}" cy="${(r() * 80).toFixed(0)}" r="${(r() * .9 + .4).toFixed(1)}"/>`;
      const mx = W * .86; s += `<circle cx="${mx}" cy="38" r="34" fill="url(#moong)"/><circle class="moon" cx="${mx}" cy="38" r="13"/><circle class="moonshade" cx="${mx + 6}" cy="35" r="12"/>`;
      if (!reduced) s += `<g class="plane"><circle r="1.4" fill="#fff"/><circle class="beacon" cx="-3" r="1.1"/><circle cx="3" r="1" fill="#6fff9a" opacity=".9"/></g>`;
      /* far skyline */
      let x = -10; while (x < W) { const w = 24 + r() * 30, h = 52 + r() * 70; s += `<rect fill="url(#gfar)" x="${x.toFixed(1)}" y="${GY - 9 - h}" width="${w.toFixed(1)}" height="${h}"/>`; if (r() > .5) for (let k = 0; k < 4; k++) s += `<rect class="win dim" x="${(x + 4 + r() * (w - 9)).toFixed(1)}" y="${(GY - 9 - h + 6 + r() * (h - 14)).toFixed(1)}" width="2.6" height="3"/>`; x += w + 1 + r() * 4; }
      s += `<rect x="0" y="${GY - 90}" width="${W}" height="82" fill="url(#cityhaze)" opacity=".5"/>`;
      /* near buildings with window grids and rooftop details */
      x = 6; const nearCenters = [];
      while (x < W) {
        const w = 34 + r() * 40, h = 56 + r() * 62, top = GY - 9 - h; s += `<rect fill="url(#gnear)" x="${x.toFixed(1)}" y="${top}" width="${w.toFixed(1)}" height="${h}"/>`;
        const cols = Math.floor((w - 8) / 9), rows = Math.floor((h - 12) / 12);
        for (let ry = 0; ry < rows; ry++) { const floorLit = r() > .62; for (let cx = 0; cx < cols; cx++) if (floorLit ? r() > .15 : r() > .72) s += `<rect class="win w${1 + Math.floor(r() * 4)}${r() > .96 ? ' blink' : ''}" style="animation-delay:${(r() * 6).toFixed(1)}s" x="${(x + 5 + cx * 9).toFixed(1)}" y="${top + 7 + ry * 12}" width="5" height="6.5"/>`; }
        const roof = r(); if (roof > .78) s += `<rect class="b-near" x="${(x + w * .2).toFixed(1)}" y="${top - 6}" width="${(w * .3).toFixed(1)}" height="6"/><rect class="b-near" x="${(x + w * .2 + 2).toFixed(1)}" y="${top - 11}" width="1.6" height="5"/><rect class="b-near" x="${(x + w * .2 + w * .3 - 4).toFixed(1)}" y="${top - 11}" width="1.6" height="5"/>`;
        else if (roof > .6) s += `<rect class="b-near" x="${(x + w / 2 - 1).toFixed(1)}" y="${top - 18}" width="2" height="18"/><circle class="beacon" cx="${(x + w / 2).toFixed(1)}" cy="${top - 19}" r="2"/>`;
        else if (roof > .5) s += `<rect class="sign" x="${(x + 4).toFixed(1)}" y="${top + 2}" width="${(w - 8).toFixed(1)}" height="4" rx="1" style="animation-delay:${(r() * 4).toFixed(1)}s"/>`;
        nearCenters.push(x + w / 2); x += w + 2 + r() * 9;
      }
      /* metro viaduct and train */
      s += `<rect class="rail" x="0" y="${GY - 46}" width="${W}" height="4"/>`; for (let px = 30; px < W; px += 110) s += `<rect class="rail" x="${px}" y="${GY - 42}" width="5" height="${42 - 9}"/>`;
      if (!reduced) s += `<g class="train" style="--w:${W + 160}px">`; else s += `<g class="train" style="--w:${W + 160}px">`;
      s += `<g>${[0, 1, 2, 3].map((i) => `<g transform="translate(${i * 49} 0)"><rect class="tr" x="0" y="${GY - 62}" width="47" height="16" rx="5"/><rect x="2" y="${GY - 52}" width="43" height="1.4" fill="rgba(255,255,255,.2)"/>${[0, 1, 2, 3, 4].map((j) => `<rect class="win lit" x="${5 + j * 8}" y="${GY - 59}" width="5.5" height="5" rx=".8"/>`).join('')}</g>`).join('')}</g></g>`;
      /* pavement, trees, lamps */
      s += `<rect class="pave" x="0" y="${GY - 9}" width="${W}" height="9"/><rect class="kerb" x="0" y="${GY}" width="${W}" height="2.2"/>`;
      for (let tx = 150; tx < W; tx += 300 + r() * 80) s += `<g><rect class="trunk" x="${tx}" y="${GY - 24}" width="3" height="15"/><circle class="canopy" cx="${tx + 1.5}" cy="${GY - 31}" r="11"/><circle class="canopy" cx="${tx - 6}" cy="${GY - 26}" r="7.5"/><circle class="canopy" cx="${tx + 9}" cy="${GY - 27}" r="8"/></g>`;
      s += `<rect class="road" x="0" y="${GY + 2}" width="${W}" height="${H - GY - 2}"/>`;
      s += `<line class="lane" x1="0" y1="${GY + 25}" x2="${W}" y2="${GY + 25}"/>`;
      for (let lx = 70; lx < W; lx += 180) s += `<g><rect class="lamp" x="${lx}" y="${GY - 40}" width="2" height="38"/><rect class="lamp" x="${lx}" y="${GY - 41}" width="9" height="2"/><circle cx="${lx + 8}" cy="${GY - 38}" r="22" fill="url(#lampg)"/><circle class="lampbulb" cx="${lx + 8}" cy="${GY - 39}" r="2.4"/><ellipse cx="${lx + 8}" cy="${GY - 1}" rx="24" ry="3" fill="rgba(255,224,150,.14)"/></g>`;
      /* people, cars */
      const nPeople = Math.max(5, Math.round(W / 105));
      for (let i = 0; i < nPeople; i++) { const dir = i % 2 ? -1 : 1, dur = 50 + r() * 26, gait = +(dur / 55 * (.95 + r() * .15)).toFixed(2); s += person(r, { dir, dur, gait, delay: -(r() * dur).toFixed(1), x0: Math.round(r() * W), h: 40 + r() * 6, W }); }
      const cars = [[1, 17, 22, false, GY + 18], [-1, 24, 6, true, GY + 36], [1, 14, 11, false, GY + 18], [-1, 19, 15, false, GY + 36]];
      cars.forEach(([dir, dur, delay, bus, y], i) => { s += car(r, { dir, dur, delay: -delay, bus, y, x0: Math.round(W * (.15 + i * .22)), W }); });
      /* you */
      const cx = W / 2, sc = 1.8, skin = '#a77455', jack = '#2f5f9a';
      s += `<ellipse cx="${cx}" cy="${GY - .5}" rx="17" ry="2.6" fill="rgba(0,0,0,.45)"/><g class="me" transform="translate(${cx} ${GY - 2}) scale(${sc})"><path d="M-3.6 -17 L-.4 -17 L-1 -1 L-3.8 -1Z" fill="#161d3a"/><path d="M.4 -17 L3.6 -17 L3.8 -1 L1 -1Z" fill="#161d3a"/><path d="M-4.3 -1.2 L-.6 -1.2 L-.6 .2 L-4.9 .2Z M.6 -1.2 L4.3 -1.2 L4.9 .2 L.6 .2Z" fill="#05081a"/><rect x="-7.4" y="-30" width="3.8" height="12.5" rx="1.7" fill="#0d1430"/><path d="M-4.9 -30.5 Q0 -32.8 4.9 -30.5 L4.4 -16.5 Q0 -15.5 -4.4 -16.5Z" fill="${jack}"/><path d="M-2.2 -30.5 L-2.6 -20 M2.2 -30.5 L2.6 -20" stroke="#0d1430" stroke-width=".8" fill="none"/><g><path d="M-1.8 -30.5 L1.2 -30.5 L1 -22 L-1.6 -22Z" fill="${jack}" transform="translate(-4 0)"/><path d="M-5.6 -22.2 L-3.2 -22.2 L-3.5 -14.5 L-5.4 -14.5Z" fill="${skin}"/><circle cx="-4.4" cy="-13.9" r="1.4" fill="${skin}"/></g><g transform="rotate(-150 4.2 -30)"><path d="M2.5 -30.5 L5.9 -30.5 L5.5 -22.5 L2.9 -22.5Z" fill="${jack}"/><g>${reduced ? '' : '<animateTransform attributeName="transform" type="rotate" values="-22 4.2 -22.5;22 4.2 -22.5;-22 4.2 -22.5" keyTimes="0;.5;1" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" dur="1s" repeatCount="indefinite"/>'}<path d="M2.9 -22.7 L5.5 -22.7 L5.2 -15.2 L3.2 -15.2Z" fill="${skin}"/><circle cx="4.2" cy="-14.5" r="1.5" fill="${skin}"/></g></g><rect x="-1.4" y="-33.5" width="2.8" height="3.5" fill="${skin}"/><ellipse cx=".5" cy="-36.8" rx="3.8" ry="4.4" fill="${skin}"/><path d="M-3.6 -37.5 Q-3.2 -42 .8 -42 Q4.6 -42 4.2 -37.6 Q1.4 -39.6 -3.6 -37.5Z" fill="#14100e"/><circle cx="2.2" cy="-36.8" r="1.5" fill="none" stroke="#dfe7ff" stroke-width=".35"/><circle cx="-.4" cy="-36.8" r="1.5" fill="none" stroke="#dfe7ff" stroke-width=".35"/></g>`;
      s += `<g class="bubble"><rect x="${cx - 74}" y="${GY - 136}" width="148" height="31" rx="15.5"/><path d="M${cx - 6} ${GY - 105.5} L${cx + 4} ${GY - 97} L${cx + 8} ${GY - 105.5}Z"/><text x="${cx}" y="${GY - 116}" text-anchor="middle">See you soon!</text></g>`;
      return s;
    };
    const fit = () => { const foot = host.parentElement, cs = getComputedStyle(foot); host.style.margin = `-${cs.paddingTop} -${cs.paddingRight} 18px -${cs.paddingLeft}`; };
    const build = () => {
      const W = Math.max(360, Math.round(host.clientWidth / (host.clientHeight / H))); if (Math.abs(W - curW) < 40 && svgEl) return; curW = W;
      host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax meet" role="presentation" focusable="false">${render(W)}</svg>`; svgEl = host.firstElementChild;
      if (!reduced && !visible) { try { svgEl.pauseAnimations(); } catch (_) {} }
    };
    fit(); build();
    let rt; addEventListener('resize', () => { fit(); clearTimeout(rt); rt = setTimeout(build, 250); });
    if (!reduced) new IntersectionObserver(([e]) => { visible = e.isIntersecting; host.classList.toggle('city-on', visible); try { visible ? svgEl.unpauseAnimations() : svgEl.pauseAnimations(); } catch (_) {} }, { threshold: .05 }).observe(host);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', buildCity); else buildCity();
})();
