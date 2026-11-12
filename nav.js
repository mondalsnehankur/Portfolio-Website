/* Navigation: mobile menu, "More" dropdown, active-section highlight. */
(() => {
  const nav = document.querySelector('header nav'); if (!nav) return;
  const burger = document.getElementById('nav-burger'), menu = document.getElementById('nav-menu'), more = document.getElementById('nav-more');
  const setOpen = (open) => { nav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); };
  burger.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) { setOpen(false); if (more) more.open = false; } });
  document.addEventListener('click', (e) => { if (more && more.open && !more.contains(e.target)) more.open = false; if (nav.classList.contains('is-open') && !nav.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (more && more.open) { more.open = false; more.querySelector('summary').focus(); } if (nav.classList.contains('is-open')) { setOpen(false); burger.focus(); } } });
  window.matchMedia('(min-width: 1001px)').addEventListener('change', () => setOpen(false));

  const links = [...nav.querySelectorAll('a[href^="#"]')].filter((a) => a.getAttribute('href').length > 1);
  const byId = new Map(); links.forEach((a) => byId.set(a.getAttribute('href').slice(1), a));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) {
        links.forEach((a) => a.removeAttribute('aria-current'));
        const a = byId.get(en.target.id); if (a) { a.setAttribute('aria-current', 'true'); if (more && more.contains(a)) more.classList.add('has-current'); }
        if (!(a && more && more.contains(a))) more && more.classList.remove('has-current');
      } });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }
})();
