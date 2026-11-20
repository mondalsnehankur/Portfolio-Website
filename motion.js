/* Motion controls: a visible "pause motion" switch, and an automatic low-power mode.
   html.motion-off  -> ambient motion stops (leaves, card swing, CSS animations); scrolling and clicks still work.
   html.lite        -> cheaper rendering (no leaves, no backdrop blur) on slow devices; chosen automatically.
   Other scripts read window.Motion.off / window.Motion.lite. */
(() => {
  const root = document.documentElement, KEY = 'portfolio-motion';
  const M = window.Motion = { off: false, lite: false };
  let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  M.off = saved ? saved === 'off' : reduced;
  const sync = () => {
    root.classList.toggle('motion-off', M.off); root.classList.toggle('lite', M.lite);
    if (btn) { btn.setAttribute('aria-pressed', String(M.off)); btn.setAttribute('aria-label', M.off ? 'Play motion' : 'Pause motion'); btn.title = M.off ? 'Motion is paused. Click to play it again' : 'Pause all motion'; btn.querySelector('.mt-ico').innerHTML = M.off ? '&#9654;' : '&#10074;&#10074;'; btn.querySelector('.mt-txt').textContent = M.off ? 'Play motion' : 'Pause motion'; }
  };
  let btn = null;
  const mount = () => {
    const bar = document.querySelector('.nav-actions'); if (!bar) return;
    btn = document.createElement('button'); btn.type = 'button'; btn.id = 'motion-toggle'; btn.className = 'theme-toggle motion-toggle';
    btn.innerHTML = '<span class="mt-ico" aria-hidden="true"></span><span class="mt-txt"></span>';
    btn.addEventListener('click', () => { M.off = !M.off; try { localStorage.setItem(KEY, M.off ? 'off' : 'on'); } catch (e) {} sync(); });
    const tt = document.getElementById('theme-toggle'); bar.insertBefore(btn, tt || null); sync();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  sync();

  /* automatic low-power mode: weak hardware hints first, then a short frame-rate check once the page has settled */
  const nav = navigator, conn = nav.connection || {};
  const weak = conn.saveData || (nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2);
  if (weak) { M.lite = true; sync(); return; }
  const probe = () => {
    let n = 0, prev = performance.now(); const gaps = [];
    const tick = (t) => {
      if (document.hidden) { prev = t; return requestAnimationFrame(tick); }
      gaps.push(t - prev); prev = t;
      if (++n < 70) return requestAnimationFrame(tick);
      gaps.shift(); gaps.sort((a, b) => a - b);
      const med = gaps[gaps.length >> 1];
      if (med > 30) { M.lite = true; sync(); }   /* under ~33 fps */
    };
    requestAnimationFrame(tick);
  };
  addEventListener('load', () => setTimeout(probe, 4500), { once: true });
})();
