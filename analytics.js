/* Privacy-friendly analytics with GoatCounter (no cookies). Does nothing until SITE_CONFIG.goatcounter is set,
 * and never runs when the visitor's browser sends Do Not Track. Counts page views and clicks on key links. */
(() => {
  'use strict';
  const cfg = window.SITE_CONFIG || {};
  const code = String(cfg.goatcounter || '').trim().toLowerCase();
  if (!/^[a-z0-9-]{2,40}$/.test(code)) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

  window.goatcounter = { no_onload: false };
  const s = document.createElement('script');
  s.async = true; s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
  document.head.appendChild(s);

  const note = document.createElement('p');
  note.className = 'analytics-note';
  note.textContent = 'Privacy-friendly analytics (GoatCounter): page views and link clicks only, no cookies, no personal data.';
  (document.querySelector('body > footer') || document.body).appendChild(note);

  if (cfg.trackClicks === false) return;
  const slug = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  function nameFor(a) {
    const href = a.getAttribute('href') || '';
    const card = a.closest('.ebook-item, .cred-item, .project-card, .note-item');
    const title = card ? (card.querySelector('h3, h4') || {}).textContent : '';
    if (/resume\.pdf/i.test(href)) return 'click/resume';
    if (/^mailto:/i.test(href)) return 'click/email';
    if (/linkedin\.com/i.test(href)) return 'click/linkedin';
    if (/simulator\.html/i.test(href)) return 'click/live-demo/physics-simulator';
    if (a.closest('.ebook-item')) return `click/ebook/${slug(title)}`;
    if (a.closest('.cred-item')) return `click/credential/${slug(title)}`;
    if (/github\.com/i.test(href)) return `click/github${card ? '/' + slug(title) : ''}`;
    if (/^https?:/i.test(href) && a.host !== location.host) return `click/external/${slug(a.hostname)}`;
    return '';
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || !window.goatcounter || typeof window.goatcounter.count !== 'function') return;
    const path = nameFor(a);
    if (path) window.goatcounter.count({ path, title: (a.textContent || path).trim().slice(0, 80), event: true });
  }, true);
  document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'contact-form' && window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: 'click/contact-form', title: 'Contact form submitted', event: true });
  }, true);
})();
