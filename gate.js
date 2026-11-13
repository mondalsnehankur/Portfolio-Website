/* Entry gate. Two access levels, chosen by the word typed:
   - owner   : the site owner's name -> full site, including the portfolio evaluator and recommendations
   - visitor : open / code / hello ... -> full site, without the evaluator score and recommendations
   NOTE: this is a presentation-level gate on a static site. The owner words are stored as hashes (not plain text),
   but anyone who reads the page source could still find the hidden panels. Use it to tidy what visitors see, not to protect secrets. */
(() => {
  const OWNER = ['dnyainileg', '28a72l7p2zq'];            // hashes of the owner's name(s); see README to change
  const VISITOR = ['open', 'code', 'hello', 'hi', 'enter', 'welcome', 'portfolio', 'visit', 'guest', 'python', 'java', 'c++', 'javascript', 'hire', 'recruiter', 'physics', 'data', 'ml', 'ai', 'hackathon', 'sudo', 'hello world', 'print', 'run', 'start', 'ok'];
  const KEY = 'portfolio-access';
  const hash = (str) => { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36); };
  const root = document.documentElement;
  let mode = null; try { mode = sessionStorage.getItem(KEY); } catch (e) {}
  const apply = (m) => { root.dataset.access = m; root.classList.remove('gated'); const intro = document.getElementById('cl-intro'); if (intro) intro.textContent = intro.dataset[m] || intro.textContent; if (m === 'visitor') document.getElementById('cl-tab-cv')?.click(); };
  if (mode === 'owner' || mode === 'visitor') root.dataset.access = mode; else root.classList.add('gated');

  document.addEventListener('DOMContentLoaded', () => {
    const lock = document.getElementById('lock-site');
    if (lock) lock.addEventListener('click', () => { try { sessionStorage.removeItem(KEY); } catch (e) {} location.reload(); });
    if (root.dataset.access) { apply(root.dataset.access); return; }
    const gate = document.createElement('div'); gate.className = 'gate'; gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true'); gate.setAttribute('aria-labelledby', 'gate-title');
    gate.innerHTML = '<form class="gate-card" autocomplete="off"><p class="gate-kicker">&gt;_ portfolio</p><h2 id="gate-title">Say the word to come in.</h2><p class="gate-sub">Type <strong>open</strong>, <strong>code</strong> or <strong>hello</strong> to enter the portfolio.</p><div class="gate-row"><span aria-hidden="true">$</span><input id="gate-input" type="text" spellcheck="false" autocapitalize="off" aria-label="Entry word" placeholder="type a word…"><button type="submit">Enter</button></div><p class="gate-msg" id="gate-msg" role="status" aria-live="polite"></p></form>';
    document.body.append(gate);
    const input = gate.querySelector('input'), msg = gate.querySelector('#gate-msg'), form = gate.querySelector('form');
    setTimeout(() => input.focus(), 50);
    form.addEventListener('submit', (e) => {
      e.preventDefault(); const v = input.value.trim().toLowerCase().replace(/\s+/g, ' ');
      const m = OWNER.includes(hash(v)) ? 'owner' : VISITOR.includes(v) ? 'visitor' : null;
      if (!m) { msg.textContent = v ? 'Not quite. Try "open" or "code".' : 'Type a word first, for example "open".'; form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); input.select(); return; }
      try { sessionStorage.setItem(KEY, m); } catch (er) {}
      gate.classList.add('leaving'); setTimeout(() => gate.remove(), 350); apply(m);
    });
  });
})();
