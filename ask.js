/* "Ask about me": a search-based assistant over this page's own content and the CV. It does not use an AI model,
 * never invents facts, and cites the section each answer comes from. Runs entirely in the browser. */
(() => {
  'use strict';
  const root = document.getElementById('career-lab');
  const form = document.getElementById('ask-form');
  if (!root || !form) return;
  const input = document.getElementById('ask-input'), log = document.getElementById('ask-log'), chipsBox = document.getElementById('ask-chips');
  const CFG = window.CAREER_LAB_CONFIG || {};
  const txt = (el) => (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  const q1 = (sel, ctx = document) => ctx.querySelector(sel);

  /* ---- knowledge base, built from the live page ---- */
  let KB = null;
  function build() {
    const P = [];
    const add = (type, label, anchor, title, body, el, links = []) => P.push({ type, label, anchor, title, body, el, links, text: `${title} ${body}` });
    document.querySelectorAll('#about .description p').forEach((p) => add('about', 'About me', '#about', 'About me', txt(p), p));
    document.querySelectorAll('.project-card').forEach((c) => {
      const title = txt(q1('h3', c)), key = (c.dataset.projectName || title).split(/\s|—/)[0].toLowerCase();
      const cs = [...document.querySelectorAll('.case-study-card')].find((d) => txt(d).toLowerCase().includes(key));
      const dlg = q1('[aria-controls]', c); const dialog = dlg ? document.getElementById(dlg.getAttribute('aria-controls')) : null;
      const links = [...c.querySelectorAll('a[href]'), ...(dialog ? dialog.querySelectorAll('a[href]') : [])].filter((a) => /^https?:/i.test(a.href) || /simulator\.html/.test(a.getAttribute('href'))).map((a) => ({ href: a.href, label: txt(a) || 'Open' }));
      add('project', `Project: ${title}`, '#project', title, `${txt(q1('.project-body p', c))} Technologies: ${[...c.querySelectorAll('.tech-tags span')].map(txt).join(', ')}. ${cs ? txt(cs) : ''}`, c, links);
    });
    const cw = q1('#current-work'); if (cw) add('project', 'Current work: Materials discovery using machine learning', '#current-work', 'Materials Discovery Using Machine Learning', `Currently working on this ongoing project. ${txt(q1('.cw-lead', cw))} ${txt(q1('.cw-text', cw))} ${[...cw.querySelectorAll('.cw-step')].map(txt).join(' ')} ${txt(q1(".cw-note", cw))} Technology stack: ${[...cw.querySelectorAll(".cw-tech span")].map(txt).join(", ")}.`, cw);
    document.querySelectorAll('.ebook-item:not(.ebook-soon)').forEach((c) => { const a = q1('a.cred-verify', c); add('ebook', `AI ebook: ${txt(q1('h4', c))}`, '#ebooks', txt(q1('h4', c)), `AI-powered ebook, course assignment. ${txt(q1('.cred-issuer', c))}`, c, a ? [{ href: a.href, label: 'Open the live ebook' }] : []); });
    document.querySelectorAll('.expercard').forEach((c) => add('experience', `Experience: ${txt(q1('h3', c))}`, '#exper', txt(q1('h3', c)), `${txt(q1('.expmeta', c))}. ${txt(q1('.experience-date', c))}. ${[...c.querySelectorAll('li')].map(txt).join(' ')}`, c));
    document.querySelectorAll('.timeline-content').forEach((c) => add('education', `Education: ${txt(q1('h3', c))}`, '#education', txt(q1('h3', c)), `${txt(q1('.education-meta', c))}. ${txt(q1('p', c))}`, c));
    document.querySelectorAll('#leadership .recognition-card').forEach((c) => add('recognition', `Leadership & recognition: ${txt(q1('h3', c))}`, '#leadership', txt(q1('h3', c)), txt(c), c));
    document.querySelectorAll('#credentials .cred-item').forEach((c) => { const a = q1('a.cred-verify', c); add('credential', `Credential: ${txt(q1('h4', c))}`, '#credentials', txt(q1('h4', c)), `${txt(q1('.cred-issuer', c))}. ${txt(q1('.cred-meta', c))}. ${[...c.querySelectorAll('.cred-subs li')].map(txt).join(', ')}`, c, a ? [{ href: a.href, label: txt(a).replace(/\s*↗$/, '') }] : []); });
    document.querySelectorAll('.skillcard').forEach((c) => add('skills', `Skills: ${txt(q1('h3', c))}`, '#skills', txt(q1('h3', c)), [...c.querySelectorAll('.skilltags span')].map(txt).join(', '), c));
    const cl = q1('#contact .contact-left');
    const links = [{ href: (CFG.owner && CFG.owner.linkedinUrl) || '', label: 'LinkedIn' }, { href: `https://github.com/${(CFG.owner && CFG.owner.githubUser) || ''}`, label: 'GitHub' }, { href: 'resume.pdf', label: 'Résumé (PDF)' }, { href: '#contact-form', label: 'Contact form' }].filter((l) => l.href);
    add('contact', 'Contact', '#contact', 'Contact', `${cl ? txt(q1('p', cl)) : ''} You can reach me through the contact form, LinkedIn or GitHub.`, cl || document.getElementById('contact'), links);
    const df = new Map(); P.forEach((p) => { p.tokens = tokens(p.text); p.titleTokens = new Set(tokens(p.title)); new Set(p.tokens).forEach((t) => df.set(t, (df.get(t) || 0) + 1)); });
    return { P, df, N: P.length };
  }

  const STOP = new Set('a an the of to in on for and or is are was were be been do does did he his him she her it its this that these those with from about as at by what which who whom how can could would should tell me please you your i my am any there their they them has have had not no yes also very really'.split(' '));
  const SYN = { interns: 'internship', intern: 'internship', internships: 'internship', certificate: 'credential', certificates: 'credential', certification: 'credential', certifications: 'credential', credentials: 'credential', course: 'credential', courses: 'credential', badge: 'credential', badges: 'credential', certified: 'credential',
    study: 'education', studied: 'education', studying: 'education', degree: 'education', university: 'education', college: 'education', school: 'education', qualification: 'education', qualifications: 'education', graduate: 'education',
    built: 'project', build: 'project', made: 'project', projects: 'project', portfolio: 'project', work: 'experience', worked: 'experience', job: 'experience', jobs: 'experience', employment: 'experience', experience: 'experience',
    books: 'ebook', book: 'ebook', ebooks: 'ebook', skills: 'skill', technologies: 'skill', tools: 'skill', language: 'skill', languages: 'skill', hire: 'contact', email: 'contact', reach: 'contact', contact: 'contact', award: 'recognition', awards: 'recognition', poster: 'recognition', leadership: 'recognition', won: 'recognition', prize: 'recognition' };
  const INTENT = { credential: 'credential', education: 'education', project: 'project', experience: 'experience', ebook: 'ebook', skill: 'skills', contact: 'contact', recognition: 'recognition' };
  function tokens(s) { return String(s).toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ').split(/\s+/).map((w) => w.replace(/^\.+|\.+$/g, '')).filter((w) => w.length > 1 && !STOP.has(w)).map((w) => SYN[w] || (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)); }

  function search(question) {
    const q = tokens(question), qset = new Set(q), boostTypes = new Set(q.map((t) => INTENT[t]).filter(Boolean));
    return KB.P.map((p) => {
      let score = 0;
      qset.forEach((t) => { const tf = p.tokens.filter((x) => x === t).length; if (!tf && !p.titleTokens.has(t)) return; const idf = Math.log(1 + KB.N / (1 + (KB.df.get(t) || 0))); score += (Math.min(tf, 3) + (p.titleTokens.has(t) ? 2.5 : 0)) * idf; });
      if (score > 0 && boostTypes.has(p.type)) score *= 1.8; else if (boostTypes.has(p.type)) score += 0.8;
      return { p, score };
    }).filter((r) => r.score > 0.9).sort((a, b) => b.score - a.score);
  }

  /* ---- rendering ---- */
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  function show(p) {
    const el = p.el; if (!el) return;
    el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    el.classList.add('ask-flash'); setTimeout(() => el.classList.remove('ask-flash'), 2200);
  }
  function source(p) {
    const box = h('div', 'ask-src'); const body = p.body.length > 320 ? p.body.slice(0, 317).trim() + '…' : p.body;
    box.append(h('strong', null, p.title), h('p', null, body));
    const row = h('div', 'ask-src-row'); row.append(h('span', 'cl-chip is-kind', p.label));
    const b = h('button', 'ask-link', 'Show on page ↓'); b.type = 'button'; b.addEventListener('click', () => show(p)); row.append(b);
    p.links.slice(0, 3).forEach((l) => { const a = h('a', 'ask-link', `${l.label} ↗`); a.href = l.href; if (/^https?:/i.test(l.href) && new URL(l.href).origin !== location.origin) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } row.append(a); });
    box.append(row); return box;
  }
  function say(who, node) { const m = h('div', `ask-msg ask-${who}`); m.append(node); log.append(m); while (log.children.length > 24) log.firstChild.remove(); log.scrollTop = log.scrollHeight; return m; }
  const reply = (lead, sources = []) => { const w = h('div'); w.append(h('p', 'ask-lead', lead)); sources.forEach((p) => w.append(source(p))); say('bot', w); };

  async function answer(question) {
    if (!KB) KB = build();
    const lq = question.toLowerCase(), api = window.CareerLab;
    // 1) skill questions: check the evidence behind each skill
    const skills = api ? [...api.extractSkills(question).keys()].filter((n) => !['Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Project Management', 'Research & Writing'].includes(n)) : [];
    if (skills.length && !/contact|reach|email/.test(lq)) {
      const base = await api.getBaseline();
      for (const name of skills.slice(0, 3)) {
        const strength = (base.skills.get(name) || { strength: 0 }).strength;
        const used = KB.P.filter((p) => !['skills', 'about'].includes(p.type) && api.extractSkills(p.text).has(name));
        if (strength === 2 && used.length) reply(`Yes. ${name} is used in ${used.length} place${used.length > 1 ? 's' : ''} on this site.`, used.slice(0, 3));
        else if (strength >= 1) reply(`${name} is listed in the skills section or CV, but I don't see a project or role on this site that shows it in use.`, KB.P.filter((p) => p.type === 'skills' && api.extractSkills(p.text).has(name)).slice(0, 1));
        else reply(`I don't find ${name} on this site or in the CV, so I can't say he has it.`);
      }
      return;
    }
    // 2) internship / availability
    if (/open to|available|looking for|seeking|internship/.test(lq) && /intern|job|role|opportunit|available|hire/.test(lq)) {
      const a = KB.P.find((p) => p.type === 'about' && /looking for internship/i.test(p.body));
      if (a) { reply('Yes. In the About section he says he is looking for internship opportunities in software development, data science and AI/ML.', [a]); return; }
    }
    // 2b) what is he working on now
    if (/working on|currently|right now|ongoing|these days|latest project/.test(lq)) { const p = KB.P.find((x) => x.anchor === '#current-work'); if (p) { reply('He is currently working on this project:', [p]); return; } }
    // 3) contact
    if (/contact|reach|email|hire|linkedin|github|resume|résumé|\bcv\b|get in touch/.test(lq)) { reply('Here is how to reach him:', [KB.P.find((p) => p.type === 'contact')]); return; }
    // 4) general search
    const hits = search(question);
    if (!hits.length) { reply("I couldn't find that on this site. I can answer questions about projects, experience, education, skills, credentials, AI ebooks, awards and contact details. Try one of the suggestions above."); return; }
    if (hits[0].score < 2.2 && !tokens(question).some((t) => INTENT[t])) { reply("I couldn't find that on this site. I can answer questions about projects, experience, education, skills, credentials, AI ebooks, awards and contact details. Try one of the suggestions above."); return; }
    const top = hits.slice(0, 3).map((h2) => h2.p);
    const wanted = tokens(question).map((t) => INTENT[t]).find((t) => ['credential', 'project', 'ebook'].includes(t));
    const listy = /which|what|list|all|how many|show/.test(lq) && wanted;
    if (listy) { const type = wanted, all = KB.P.filter((p) => p.type === type); reply(`There ${all.length === 1 ? 'is' : 'are'} ${all.length} ${type === 'credential' ? 'credential entr' + (all.length === 1 ? 'y' : 'ies') : type === 'ebook' ? 'AI ebook' + (all.length === 1 ? '' : 's') : 'featured project' + (all.length === 1 ? '' : 's')} on this site:`, all.slice(0, 6)); return; }
    reply(hits[0].score > 4 ? 'This is the closest match I found:' : 'I\'m not certain, but these are the closest matches on the site:', top);
  }

  const SUGGEST = ['What projects has he built?', 'Does he know Python?', 'Which certifications does he have?', 'Is he open to internships?', 'Tell me about his education', 'How can I contact him?'];
  SUGGEST.forEach((s) => { const b = h('button', 'cl-chip ask-chip', s); b.type = 'button'; b.addEventListener('click', () => { input.value = s; form.requestSubmit(); }); chipsBox.append(b); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); const q = input.value.trim().slice(0, 200); if (!q) return;
    say('you', h('p', null, q)); input.value = '';
    try { await answer(q); } catch (err) { reply('Something went wrong while searching. Please try rephrasing.'); }
  });
})();
