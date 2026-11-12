/* Space Mission Calculator (live). All physics comes from the C code in wasm/src, compiled to WebAssembly.
 * This file only builds the interface and draws the canvas. */
(async () => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const loadMsg = $('sim-load');

  /* ---- theme ---- */
  const root = document.documentElement, themeBtn = $('theme-toggle');
  const stored = (() => { try { return localStorage.getItem('portfolio-theme'); } catch (_) { return null; } })();
  const setTheme = (t) => { root.dataset.theme = t; themeBtn.textContent = t === 'light' ? '☾' : '☼'; themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark mode' : 'Switch to light mode'); cssCache = null; };
  let cssCache = null;
  setTheme(stored === 'light' || stored === 'dark' ? stored : (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  themeBtn.addEventListener('click', () => { const n = root.dataset.theme === 'light' ? 'dark' : 'light'; setTheme(n); try { localStorage.setItem('portfolio-theme', n); } catch (_) { /* storage blocked */ } });
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const colors = () => cssCache || (cssCache = { ink: css('--ink'), muted: css('--muted'), accent: css('--accent'), accent2: css('--accent2'), line: css('--line'), bad: css('--bad'), canvas: css('--canvas') });

  /* ---- load WebAssembly (embedded base64, so it also works when opened from disk) ---- */
  let X;
  try {
    if (!window.WebAssembly) throw new Error('This browser has no WebAssembly support.');
    const bin = Uint8Array.from(atob(window.SPACE_WASM_B64), (c) => c.charCodeAt(0));
    X = (await WebAssembly.instantiate(bin, {})).instance.exports;
  } catch (e) { loadMsg.textContent = `Could not start the WebAssembly module: ${e.message}`; return; }
  loadMsg.textContent = 'WebAssembly module loaded: 22 exported C functions, no server involved.';
  $('sim-app').hidden = false;

  const cstr = (p) => { const m = new Uint8Array(X.memory.buffer); let s = ''; while (m[p]) s += String.fromCharCode(m[p++]); return s; };
  const bodies = Array.from({ length: X.body_count() }, (_, i) => ({
    i, name: cstr(X.body_name(i)), mass: X.body_mass(i), radius: X.body_radius(i), distKm: X.body_distance_km(i),
    periodDays: X.body_period_days(i), moons: X.body_moons(i), orbitType: X.body_orbit_type(i), notes: cstr(X.body_notes(i))
  }));
  const SUN = bodies.find((b) => b.name === 'Sun'), EARTH = bodies.find((b) => b.name === 'Earth');
  const gOf = (b) => X.calc_surface_gravity(b.mass, b.radius), vescOf = (b) => X.calc_escape_velocity(b.mass, b.radius);
  const sci = (n) => { const [m, e] = n.toExponential(3).split('e'); return `${m} × 10${[...String(+e)].map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹⁻'['0123456789-'.indexOf(c)]).join('')}`; };
  const num = (n, d = 2) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }) : 'n/a');
  const fillSelect = (sel, list, idx) => { sel.replaceChildren(...list.map((b) => new Option(b.name, b.i))); if (idx != null) sel.value = idx; };

  /* ---- planet explorer ---- */
  const exSel = $('explore-body'), toSel = $('travel-to'), cmpA = $('cmp-a'), cmpB = $('cmp-b');
  fillSelect(exSel, bodies, EARTH.i); fillSelect(cmpA, bodies, EARTH.i); fillSelect(cmpB, bodies, bodies.find((b) => b.name === 'Mars').i);
  const stat = (label, value) => { const d = document.createElement('div'); d.className = 'sim-stat'; const s = document.createElement('span'); s.textContent = label; const v = document.createElement('strong'); v.textContent = value; d.append(s, v); return d; };
  function renderExplorer() {
    const b = bodies[+exSel.value], g = gOf(b), cards = [
      stat('Mass', `${sci(b.mass)} kg`), stat('Radius', `${num(b.radius / 1000, 0)} km`),
      stat('Surface gravity', `${num(g, 3)} m/s² (${num(g / gOf(EARTH), 2)}× Earth)`), stat('Escape velocity', `${num(vescOf(b) / 1000, 3)} km/s`), stat('Moons (stored)', String(b.moons))];
    if (b.distKm > 0) cards.push(stat('Distance from Sun', `${num(b.distKm / 1e6, 1)} million km`));
    if (b.orbitType === 0 && b.distKm > 0) {
      const r = b.distKm * 1000, v = X.calc_circular_velocity(SUN.mass, r), T = X.calc_circular_period_days(SUN.mass, r);
      cards.push(stat('Orbital velocity (circular)', `${num(v / 1000, 3)} km/s`), stat('Orbital period, calculated', `${num(T, 1)} days`), stat('Period, reference', `${num(b.periodDays, 1)} days (${num(100 * (T - b.periodDays) / b.periodDays, 1)}%)`));
    }
    $('explore-stats').replaceChildren(...cards); $('explore-notes').textContent = b.notes;
    const others = bodies.filter((o) => o.i !== b.i); const keep = toSel.value; fillSelect(toSel, others); if (others.some((o) => String(o.i) === keep)) toSel.value = keep;
    renderWeight(); renderTravel();
  }
  function renderWeight() {
    const b = bodies[+exSel.value], m = parseFloat($('weight-mass').value), out = $('weight-out');
    if (!(m > 0)) { out.textContent = 'Enter a mass above 0.'; return; }
    const w = X.calc_weight(m, gOf(b)); out.textContent = `${num(w, 1)} N on ${b.name} (feels like ${num(w / gOf(EARTH), 1)} kg on Earth)`;
  }
  function renderTravel() {
    const a = bodies[+exSel.value], b = bodies[+toSel.value], v = parseFloat($('travel-speed').value), out = $('travel-out');
    const dist = Math.abs(a.distKm - b.distKm);
    if (!(v > 0)) { out.textContent = 'Enter a speed above 0.'; return; }
    if (!(dist > 0)) { out.textContent = 'The stored data gives no usable radial distance for this pair.'; return; }
    const d = X.calc_travel_days(dist, v); out.textContent = `${num(dist / 1e6, 1)} million km → ${num(d, 1)} days (${num(d / 365.25, 2)} years)`;
  }
  function renderCompare() {
    const a = bodies[+cmpA.value], b = bodies[+cmpB.value], t = $('cmp-table'), rows = [
      ['Mass (kg)', sci(a.mass), sci(b.mass)], ['Radius (km)', num(a.radius / 1000, 0), num(b.radius / 1000, 0)],
      ['Surface gravity (m/s²)', num(gOf(a), 3), num(gOf(b), 3)], ['Escape velocity (km/s)', num(vescOf(a) / 1000, 3), num(vescOf(b) / 1000, 3)],
      ['Distance from Sun (million km)', num(a.distKm / 1e6, 1), num(b.distKm / 1e6, 1)], ['Moons (stored)', a.moons, b.moons]];
    t.replaceChildren(); const head = t.createTHead().insertRow(); ['Property', a.name, b.name].forEach((h) => { const th = document.createElement('th'); th.textContent = h; head.append(th); });
    const tb = t.createTBody(); rows.forEach((r) => { const tr = tb.insertRow(); r.forEach((c) => { tr.insertCell().textContent = c; }); });
  }
  exSel.addEventListener('change', renderExplorer); toSel.addEventListener('change', renderTravel);
  $('weight-mass').addEventListener('input', renderWeight); $('travel-speed').addEventListener('input', renderTravel);
  cmpA.addEventListener('change', renderCompare); cmpB.addEventListener('change', renderCompare);
  renderExplorer(); renderCompare();

  /* ---- orbit lab ---- */
  const cv = $('orbit-canvas'), ctx = cv.getContext('2d');
  const bodySel = $('orbit-body'), radEl = $('orbit-radius'), spdEl = $('orbit-speed'), timeEl = $('orbit-time');
  const st = new Float64Array(X.memory.buffer, X.orbit_state(), 8);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const orb = { b: EARTH, playing: !reduce, trail: [], done: '', M: 0, R: 0, r0: 0, ratio: 1, Tc: 1, extent: 1, peri: -1, apo: -1, ecc: 0 };
  fillSelect(bodySel, bodies, EARTH.i);
  const maxMult = () => (orb.b.name === 'Sun' ? 500 : 60);
  const rMult = () => 1.05 * Math.pow(maxMult() / 1.05, +radEl.value / 100);
  const km = (m) => `${num(m / 1000, 0)} km`;
  const dur = (s) => (s < 7200 ? `${num(s / 60, 1)} min` : s < 172800 ? `${num(s / 3600, 1)} h` : `${num(s / 86400, 1)} days`);

  function relaunch() {
    const b = orb.b; orb.M = b.mass; orb.R = b.radius; orb.ratio = +spdEl.value; orb.r0 = b.radius * rMult(); orb.trail = []; orb.done = '';
    X.orbit_init(orb.M, orb.r0, orb.ratio);
    const vc = X.calc_circular_velocity(orb.M, orb.r0), v = orb.ratio * vc, vesc = Math.SQRT2 * vc, eps = X.orbit_energy(orb.M, orb.r0, v);
    orb.Tc = 2 * Math.PI * orb.r0 / vc; orb.peri = X.orbit_apsis(orb.M, orb.r0, v, 0); orb.apo = X.orbit_apsis(orb.M, orb.r0, v, 1);
    orb.ecc = Math.abs(orb.r0 * v * v / (6.6743e-11 * orb.M) - 1);
    const bound = eps < 0, impact = bound && orb.peri < orb.R;
    orb.extent = bound ? Math.max(orb.apo, orb.r0) * 1.12 : orb.r0 * 8;
    let label = Math.abs(orb.ratio - 1) < 0.005 ? 'Circular orbit' : bound ? 'Elliptical orbit' : Math.abs(orb.ratio - Math.SQRT2) < 0.005 ? 'Parabolic: exactly escape speed' : 'Escape trajectory';
    if (impact) label = 'Impact trajectory';
    $('orbit-state').textContent = label; orb.label = label;
    const rows = [['Launch altitude', km(orb.r0 - orb.R)], ['Circular speed here', `${num(vc / 1000, 3)} km/s`], ['Escape speed here', `${num(vesc / 1000, 3)} km/s`], ['Your launch speed', `${num(v / 1000, 3)} km/s`]];
    if (bound) { const a = (orb.peri + orb.apo) / 2; rows.push(['Lowest point', `${km(orb.peri - orb.R)} ${orb.peri < orb.R ? '(underground)' : 'altitude'}`], ['Highest point', `${km(orb.apo - orb.R)} altitude`], ['Orbital period', dur(2 * Math.PI * Math.sqrt(a ** 3 / (6.6743e-11 * orb.M)))]); }
    else rows.push(['Orbit type', 'Unbound: leaves for good']);
    $('orbit-stats').replaceChildren(...rows.flatMap(([k, val]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = k; dd.textContent = val; return [dt, dd]; }));
    cv.setAttribute('aria-label', `Orbit simulation around ${b.name}: ${label}`);
    $('orbit-radius-out').textContent = b.name === 'Sun' ? `${num(orb.r0 / 1.496e11, 2)} AU` : `${km(orb.r0 - orb.R)} up`;
    $('orbit-speed-out').textContent = `${num(orb.ratio, 2)} × circular`; $('orbit-time-out').textContent = `${timeEl.value}×`;
    draw();
  }
  function resize() { const w = cv.clientWidth || 720, dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * dpr); cv.height = Math.round(w * 0.78 * dpr); draw(); }

  function draw() {
    const c = colors(), W = cv.width, H = cv.height, s = (Math.min(W, H) / 2) * 0.86 / orb.extent, cx = W / 2, cy = H / 2, u = W / 720;
    ctx.fillStyle = c.canvas; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = c.line; ctx.lineWidth = 1 * u; [0.5, 1].forEach((f) => { ctx.beginPath(); ctx.arc(cx, cy, (Math.min(W, H) / 2) * 0.86 * f, 0, 7); ctx.stroke(); });
    const P = (x, y) => [cx + x * s, cy - y * s];
    // predicted path (bound orbits)
    if (orb.apo > 0 && orb.peri >= 0) {
      const a = (orb.peri + orb.apo) / 2, e = orb.ecc, p = a * (1 - e * e), sign = orb.ratio > 1 ? 1 : -1;
      ctx.setLineDash([6 * u, 6 * u]); ctx.strokeStyle = c.accent2; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5 * u; ctx.beginPath();
      for (let k = 0; k <= 360; k++) { const th = k * Math.PI / 180, r = p / (1 + sign * e * Math.cos(th)), [x, y] = P(r * Math.cos(th), r * Math.sin(th)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    // central body
    const br = Math.max(orb.R * s, 5 * u), [bx, by] = P(0, 0), grad = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, br * 0.1, bx, by, br);
    const sun = orb.b.name === 'Sun'; grad.addColorStop(0, sun ? '#fff3b0' : '#b7a6ff'); grad.addColorStop(1, sun ? '#ff9f1c' : '#4a3a9c');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); ctx.fill();
    // trail
    if (orb.trail.length > 1) { ctx.strokeStyle = c.accent; ctx.lineWidth = 2 * u; ctx.beginPath(); orb.trail.forEach(([x, y], k) => { const [px, py] = P(x, y); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke(); }
    // spacecraft
    const [sx, sy] = P(st[0], st[1]); ctx.fillStyle = orb.done === 'impact' ? c.bad : c.ink; ctx.beginPath(); ctx.arc(sx, sy, 4.5 * u, 0, 7); ctx.fill();
    ctx.fillStyle = c.muted; ctx.font = `${12 * u}px Poppins, sans-serif`; ctx.fillText(`outer ring ≈ ${num(orb.extent / 0.86 / 1000, 0)} km`, 12 * u, H - 12 * u);
  }

  let last = 0;
  function frame(ts) {
    const dtReal = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (orb.playing && !orb.done) {
      const simDt = (orb.Tc / 10) * +timeEl.value * dtReal, steps = Math.min(2000, Math.max(1, Math.ceil(simDt / (orb.Tc / 12000))));
      if (simDt > 0) {
        X.orbit_advance(orb.M, simDt, steps);
        orb.trail.push([st[0], st[1]]); if (orb.trail.length > 2500) orb.trail.shift();
        const r = Math.hypot(st[0], st[1]);
        if (r < orb.R) { orb.done = 'impact'; $('orbit-state').textContent = 'Impact: the spacecraft hit the surface'; }
        else if (r > orb.extent * 1.15 && orb.apo < 0) { orb.done = 'escaped'; $('orbit-state').textContent = 'Escaped: not coming back'; }
        draw();
      }
    }
    requestAnimationFrame(frame);
  }
  const playBtn = $('orbit-play'); const syncPlay = () => { playBtn.textContent = orb.playing ? 'Pause' : 'Play'; };
  playBtn.addEventListener('click', () => { orb.playing = !orb.playing; syncPlay(); });
  $('orbit-reset').addEventListener('click', () => { orb.playing = true; syncPlay(); relaunch(); });
  bodySel.addEventListener('change', () => { orb.b = bodies[+bodySel.value]; radEl.value = orb.b.name === 'Sun' ? 86 : 15; relaunch(); });
  [radEl, spdEl].forEach((el) => el.addEventListener('input', relaunch));
  timeEl.addEventListener('input', () => { $('orbit-time-out').textContent = `${timeEl.value}×`; });
  document.querySelectorAll('.sim-presets button').forEach((b) => b.addEventListener('click', () => { spdEl.value = b.dataset.speed; orb.playing = true; syncPlay(); relaunch(); }));
  new ResizeObserver(resize).observe(cv);
  syncPlay(); relaunch(); resize(); requestAnimationFrame(frame);

  /* ---- self-tests ---- */
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  function runTests() {
    const saved = Array.from(st), mars = bodies.find((b) => b.name === 'Mars'), jup = bodies.find((b) => b.name === 'Jupiter');
    const tests = [
      ['Earth surface gravity ≈ 9.82 m/s²', gOf(EARTH), 9.82, 0.05, 'm/s²'], ['Earth escape velocity ≈ 11.19 km/s', vescOf(EARTH) / 1000, 11.19, 0.05, 'km/s'],
      ['Mars escape velocity ≈ 5.03 km/s', vescOf(mars) / 1000, 5.03, 0.05, 'km/s'], ['Jupiter surface gravity ≈ 25.9 m/s²', gOf(jup), 25.9, 0.2, 'm/s²'],
      ['Earth circular speed around the Sun ≈ 29.8 km/s', X.calc_circular_velocity(SUN.mass, EARTH.distKm * 1000) / 1000, 29.8, 0.1, 'km/s'],
      ['Earth orbital period ≈ 365.25 days', X.calc_circular_period_days(SUN.mass, EARTH.distKm * 1000), 365.25, 1.5, 'days']];
    const results = tests.map(([name, got, want, tol, unit]) => ({ name, ok: near(got, want, tol), detail: `${num(got, 3)} ${unit} (expected ${want} ± ${tol})` }));
    results.push({ name: 'Invalid input (negative mass) returns NaN', ok: Number.isNaN(X.calc_escape_velocity(-1, 1)), detail: 'checks the C input validation' });
    const r = EARTH.radius * 1.3; X.orbit_init(EARTH.mass, r, 1); const T = 2 * Math.PI * r / X.calc_circular_velocity(EARTH.mass, r); X.orbit_advance(EARTH.mass, T, 6000);
    const drift = Math.abs(Math.hypot(st[0], st[1]) / r - 1), back = Math.hypot(st[0] - r, st[1]) / r;
    results.push({ name: 'Circular orbit closes after one period', ok: drift < 1e-4 && back < 1e-3, detail: `radius drift ${drift.toExponential(1)}, position error ${back.toExponential(1)} × r` });
    saved.forEach((v, k) => { st[k] = v; });
    $('tests-list').replaceChildren(...results.map((t) => { const li = document.createElement('li'), m = document.createElement('span'), n = document.createElement('span'), d = document.createElement('small'); m.className = t.ok ? 'ok' : 'fail'; m.textContent = t.ok ? '✓' : '✗'; m.setAttribute('aria-label', t.ok ? 'Passed' : 'Failed'); n.textContent = t.name; d.textContent = t.detail; li.append(m, n, d); return li; }));
  }
  $('tests-run').addEventListener('click', runTests); runTests();
})();
