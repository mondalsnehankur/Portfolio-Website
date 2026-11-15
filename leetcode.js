/* LeetCode "Problem solving" card. Reads window.SITE_CONFIG.leetcode (see site-config.js). Shows nothing until a username is set. */
(() => {
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  function render(cfg) {
    if (!cfg || !cfg.username) return;
    const user = String(cfg.username).trim().replace(/^@/, ''); if (!user) return;
    const url = `https://leetcode.com/u/${encodeURIComponent(user)}/`;
    document.getElementById('problem-solving')?.remove();
    const e = Math.max(0, +cfg.easy || 0), m = Math.max(0, +cfg.medium || 0), h = Math.max(0, +cfg.hard || 0), total = e + m + h;
    const bar = (label, n, cls) => `<li class="ps-row ${cls}"><span>${label}</span><span class="ps-track" aria-hidden="true"><i style="width:${total ? Math.max(4, Math.round((n / total) * 100)) : 0}%"></i></span><b>${n}</b></li>`;
    const sec = document.createElement('section'); sec.id = 'problem-solving'; sec.className = 'ps-section'; sec.setAttribute('aria-labelledby', 'ps-title');
    sec.innerHTML = `<p class="section-kicker">PROBLEM SOLVING</p>
      <div class="section-heading-row"><div><h2 id="ps-title">Data structures and algorithms.</h2><p class="section-intro">${esc(cfg.note || 'Practising data structures and algorithms regularly.')}</p></div></div>
      <div class="ps-card">
        ${total ? `<div class="ps-total"><strong>${total}</strong><span>problems solved</span>${cfg.rating ? `<small>Contest rating ${esc(cfg.rating)}</small>` : ''}</div>
        <ul class="ps-bars" aria-label="Problems solved by difficulty">${bar('Easy', e, 'is-easy')}${bar('Medium', m, 'is-medium')}${bar('Hard', h, 'is-hard')}</ul>` : `<div class="ps-total ps-empty"><strong>@${esc(user)}</strong><span>on LeetCode</span></div>`}
        <div class="ps-side"><a class="primary-btn" href="${url}" target="_blank" rel="noopener noreferrer">View LeetCode profile <span aria-hidden="true">↗</span></a>${cfg.updated ? `<small>Numbers updated ${esc(cfg.updated)}</small>` : ''}</div>
      </div>`;
    (document.getElementById('notes') || document.querySelector('footer'))?.before(sec);
    document.querySelectorAll('.foot-grid div').forEach((d) => { if (d.querySelector('h2')?.textContent === 'Connect' && !d.querySelector('[data-lc]')) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'LeetCode'; a.dataset.lc = '1'; d.append(a); } });
  }
  window.PortfolioLeetCode = { render };
  document.addEventListener('DOMContentLoaded', () => render(window.SITE_CONFIG && window.SITE_CONFIG.leetcode));
})();
