/* Live clock + weather chip (nav) that also steers the background scene.
   Place: the visitor's own location if they choose "Use my location" (browser permission), otherwise Delhi NCR.
   Data: Open-Meteo (free, no key). Coordinates are never stored; only the preference "visitor" is remembered.
   Preview any condition without waiting for weather: add ?wx=clear | cloudy | fog | rain | storm | snow to the URL.
   Publishes window.LiveWeather for scene.js / landscape.js. If the request fails the chip keeps the clock and the scene stays calm. */
(() => {
  const DELHI = { lat: 28.6139, lon: 77.209, name: 'Delhi NCR' }, KEY = 'portfolio-wx-loc', CK = 'portfolio-wx-cache';
  const LW = window.LiveWeather = { loaded: false, cloud: .4, mist: 0, rain: 0, snow: 0, storm: false, wind: 0 };
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }, del: (k) => { try { localStorage.removeItem(k); } catch (e) {} } };
  /* WMO weather codes -> what the scene should do */
  const KINDS = [
    [[0], 'Clear sky', 'sun', { cloud: .05 }], [[1], 'Mostly clear', 'sun', { cloud: .2 }], [[2], 'Partly cloudy', 'cloud', { cloud: .55 }], [[3], 'Overcast', 'cloud', { cloud: 1 }],
    [[45, 48], 'Fog', 'fog', { cloud: .8, mist: 1 }], [[51, 53, 55, 56, 57], 'Drizzle', 'rain', { cloud: .9, rain: .35, mist: .3 }], [[61, 80], 'Light rain', 'rain', { cloud: .95, rain: .5 }],
    [[63, 81, 66], 'Rain', 'rain', { cloud: 1, rain: .75 }], [[65, 82, 67], 'Heavy rain', 'rain', { cloud: 1, rain: 1 }], [[71, 77, 85], 'Light snow', 'snow', { cloud: .9, snow: .5 }], [[73, 75, 86], 'Snow', 'snow', { cloud: 1, snow: 1 }],
    [[95, 96, 99], 'Thunderstorm', 'storm', { cloud: 1, rain: .9, storm: true }]];
  const kindOf = (code) => KINDS.find((k) => k[0].includes(code)) || KINDS[2];
  const PREVIEW = { clear: 0, cloudy: 3, fog: 45, rain: 63, storm: 95, snow: 73 };
  const ICON = { sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>', cloud: '<path d="M7 18a4 4 0 0 1-.6-8A6 6 0 0 1 18 11a3.5 3.5 0 0 1-.5 7z"/>', fog: '<path d="M4 9h16M3 13h14M6 17h14"/>', rain: '<path d="M7 14a4 4 0 0 1-.6-8A6 6 0 0 1 18 7a3.5 3.5 0 0 1-.5 7z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>', snow: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>', storm: '<path d="M7 14a4 4 0 0 1-.6-8A6 6 0 0 1 18 7a3.5 3.5 0 0 1-.5 7z"/><path d="M12 14l-2 4h3l-2 4"/>' };
  const svg = (k) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

  const S = { place: DELHI.name, who: 'default', offset: 19800, tz: 'IST', temp: null, label: '', icon: 'cloud', wind: null, ok: false };
  const apply = (code, wind, temp) => {
    const k = kindOf(code), o = k[3]; LW.cloud = o.cloud || 0; LW.mist = o.mist || 0; LW.rain = o.rain || 0; LW.snow = o.snow || 0; LW.storm = !!o.storm; LW.wind = wind || 0; LW.loaded = true;
    S.label = k[1]; S.icon = k[2]; S.temp = temp; S.wind = wind; S.ok = true; paint();
  };

  /* ---------- UI ---------- */
  let chip, pop, timeEl, tempEl, iconEl, rows = {}, open = false;
  const pad = (n) => String(n).padStart(2, '0');
  const clock = () => { const d = new Date(Date.now() + S.offset * 1000); return pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()); };
  const paint = () => {
    if (!chip) return;
    tempEl.textContent = S.temp == null ? '' : Math.round(S.temp) + '°'; chip.classList.toggle('has-wx', S.temp != null);
    iconEl.innerHTML = svg(S.icon); rows.place.textContent = S.place; rows.cond.textContent = S.ok ? S.label + (S.temp != null ? ', ' + Math.round(S.temp) + '°C' : '') : 'Weather unavailable right now';
    rows.wind.textContent = S.wind != null ? 'Wind ' + Math.round(S.wind) + ' km/h' : ''; rows.tz.textContent = 'Local time (' + S.tz + ')';
    rows.btn.textContent = S.who === 'visitor' ? 'Back to Delhi NCR' : 'Use my location';
    chip.setAttribute('aria-label', 'Live clock and weather for ' + S.place + ': ' + clock() + (S.ok ? ', ' + S.label : ''));
  };
  const mount = () => {
    const bar = document.querySelector('.nav-actions'); if (!bar) return;
    chip = document.createElement('button'); chip.type = 'button'; chip.id = 'wx-chip'; chip.className = 'theme-toggle wx-chip'; chip.setAttribute('aria-expanded', 'false'); chip.setAttribute('aria-controls', 'wx-pop');
    chip.innerHTML = '<span class="wx-ico"></span><span class="wx-time">--:--:--</span><span class="wx-temp"></span>';
    iconEl = chip.querySelector('.wx-ico'); timeEl = chip.querySelector('.wx-time'); tempEl = chip.querySelector('.wx-temp');
    pop = document.createElement('div'); pop.id = 'wx-pop'; pop.className = 'wx-pop'; pop.hidden = true; pop.innerHTML = '<p class="wx-place"></p><p class="wx-cond"></p><p class="wx-wind"></p><p class="wx-tz"></p><button type="button" class="wx-btn"></button><p class="wx-note">Weather from Open-Meteo. Your location is used once and not stored.</p>';
    rows = { place: pop.querySelector('.wx-place'), cond: pop.querySelector('.wx-cond'), wind: pop.querySelector('.wx-wind'), tz: pop.querySelector('.wx-tz'), btn: pop.querySelector('.wx-btn') };
    bar.insertBefore(chip, bar.firstChild); document.body.append(pop);
    const place = () => { const r = chip.getBoundingClientRect(); pop.style.top = (r.bottom + 10) + 'px'; pop.style.right = Math.max(8, innerWidth - r.right) + 'px'; };
    const toggle = (v) => { open = v == null ? !open : v; pop.hidden = !open; chip.setAttribute('aria-expanded', String(open)); if (open) place(); };
    chip.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    document.addEventListener('click', (e) => { if (open && !pop.contains(e.target)) toggle(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { toggle(false); chip.focus(); } });
    addEventListener('scroll', () => { if (open) toggle(false); }, { passive: true }); addEventListener('resize', () => { if (open) place(); });
    rows.btn.addEventListener('click', () => { if (S.who === 'visitor') { store.del(KEY); go(DELHI, 'default'); } else locate(); });
    setInterval(() => { timeEl.textContent = clock(); }, 1000); timeEl.textContent = clock(); paint();
  };

  /* ---------- data ---------- */
  const tzAbbr = (j) => { const a = j.timezone_abbreviation; return !a || /^[+-]?\d/.test(a) ? (j.timezone || 'local') : a === 'GMT+5:30' ? 'IST' : a; };
  const go = async (p, who, name) => {
    S.who = who; S.place = name || p.name;
    const q = new URLSearchParams(location.search).get('wx');
    if (q && q in PREVIEW) { S.offset = 19800; S.tz = 'IST'; S.place = 'Preview'; apply(PREVIEW[q], 14, 27); return; }
    try {
      const j = JSON.parse(sessionStorage.getItem(CK) || 'null');
      if (j && j.k === p.lat.toFixed(1) + ',' + p.lon.toFixed(1) && Date.now() - j.t < 10 * 60 * 1000) { S.offset = j.off; S.tz = j.tz; apply(j.code, j.wind, j.temp); return; }
    } catch (e) {}
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`); if (!r.ok) throw new Error(r.status);
      const j = await r.json(), c = j.current; S.offset = j.utc_offset_seconds || 0; S.tz = tzAbbr(j);
      try { sessionStorage.setItem(CK, JSON.stringify({ k: p.lat.toFixed(1) + ',' + p.lon.toFixed(1), t: Date.now(), off: S.offset, tz: S.tz, code: c.weather_code, wind: c.wind_speed_10m, temp: c.temperature_2m })); } catch (e) {}
      apply(c.weather_code, c.wind_speed_10m, c.temperature_2m);
    } catch (e) { S.ok = false; LW.loaded = false; paint(); }
  };
  const nameFor = async (p) => { try { const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${p.lat}&longitude=${p.lon}&localityLanguage=en`); const j = await r.json(); return j.city || j.locality || j.principalSubdivision || 'Your location'; } catch (e) { return 'Your location'; } };
  const locate = () => {
    if (!navigator.geolocation) { rows.cond.textContent = 'Your browser cannot share a location.'; return; }
    rows.btn.disabled = true; rows.btn.textContent = 'Waiting for permission...';
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const p = { lat: pos.coords.latitude, lon: pos.coords.longitude }; store.set(KEY, 'visitor'); const nm = await nameFor(p); rows.btn.disabled = false; go(p, 'visitor', nm);
    }, () => { rows.btn.disabled = false; store.del(KEY); go(DELHI, 'default'); rows.cond.textContent = 'Location not shared, showing Delhi NCR.'; }, { maximumAge: 600000, timeout: 12000 });
  };

  const start = () => {
    mount(); go(DELHI, 'default');
    /* a returning visitor who already said yes gets their own weather without a new prompt */
    if (store.get(KEY) === 'visitor' && navigator.permissions && navigator.permissions.query) navigator.permissions.query({ name: 'geolocation' }).then((s) => { if (s.state === 'granted') locate(); else store.del(KEY); }).catch(() => {});
    setInterval(() => { try { sessionStorage.removeItem(CK); } catch (e) {} if (S.who === 'default') go(DELHI, 'default'); else if (store.get(KEY) === 'visitor') locate(); }, 15 * 60 * 1000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
