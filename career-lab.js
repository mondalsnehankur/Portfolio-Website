/* Career Lab: portfolio evaluator, CV comparison, career recommendations, LinkedIn/Coursera import.
 * Runs entirely in the visitor's browser. Nothing is uploaded; imports are kept in localStorage only.
 * Settings live in career-config.js. */
(() => {
  'use strict';
  const CFG = window.CAREER_LAB_CONFIG || {};
  const root = document.getElementById('career-lab');
  if (!root) return;

  /* ---------- tiny helpers ---------- */
  const $ = (sel, ctx = root) => ctx.querySelector(sel);
  const $$ = (sel, ctx = root) => Array.from(ctx.querySelectorAll(sel));
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const round1 = (n) => Math.round(n * 10) / 10;
  const words = (s) => (s.trim().match(/\S+/g) || []).length;
  const clean = (s, max = 200) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  const normalizeText = (t) => String(t || '')
    .replace(/ /g, ' ').replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl').replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"').replace(/[‐-―−]/g, '-').replace(/[ \t]+/g, ' ');
  function safeHttps(url) {
    try { const u = new URL(url, location.href); return u.protocol === 'https:' ? u : null; } catch (_) { return null; }
  }
  function say(el, msg) { el.textContent = msg; }

  /* ---------- skill taxonomy ---------- */
  // [name, category, aliases, family, weight]  (weight < 1 = soft skills count less in comparisons)
  const T = [
    ['Python', 'Languages', ['python'], 'py'], ['Java', 'Languages', ['java'], 'jvm'],
    ['C', 'Languages', ['C'], 'sys', 1, true], ['C++', 'Languages', ['c++'], 'sys'],
    ['R', 'Languages', ['R'], 'rlang', 1, true], ['SQL', 'Languages', ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'mariadb'], 'db'],
    ['JavaScript', 'Web', ['javascript', 'ecmascript', 'es6'], 'fe'], ['TypeScript', 'Web', ['typescript'], 'fe'],
    ['HTML', 'Web', ['html', 'html5'], 'fe'], ['CSS', 'Web', ['css', 'css3', 'sass', 'scss'], 'fe'],
    ['React', 'Web', ['react', 'react.js', 'reactjs'], 'fe'], ['Next.js', 'Web', ['next.js', 'nextjs'], 'fe'],
    ['Angular', 'Web', ['angular'], 'fe'], ['Vue', 'Web', ['vue', 'vue.js', 'vuejs'], 'fe'],
    ['Tailwind CSS', 'Web', ['tailwind', 'tailwind css'], 'fe'], ['Bootstrap', 'Web', ['bootstrap'], 'fe'],
    ['Node.js', 'Web', ['node.js', 'nodejs', 'node'], 'be'], ['Express', 'Web', ['express', 'express.js', 'expressjs'], 'be'],
    ['Flask', 'Web', ['flask'], 'be'], ['Django', 'Web', ['django'], 'be'], ['FastAPI', 'Web', ['fastapi'], 'be'],
    ['REST APIs', 'Web', ['rest', 'restful', 'rest api', 'rest apis', 'api development'], 'be'],
    ['MongoDB', 'Data stores', ['mongodb', 'mongo'], 'db'], ['Firebase', 'Data stores', ['firebase'], 'db'],
    ['Streamlit', 'Data & ML', ['streamlit'], 'dash'],
    ['NumPy', 'Data & ML', ['numpy'], 'pydata'], ['SciPy', 'Data & ML', ['scipy'], 'pydata'], ['Pandas', 'Data & ML', ['pandas'], 'pydata'],
    ['Matplotlib', 'Data & ML', ['matplotlib'], 'viz'], ['Seaborn', 'Data & ML', ['seaborn'], 'viz'],
    ['Scikit-learn', 'Data & ML', ['scikit-learn', 'scikit learn', 'sklearn'], 'mlfw'],
    ['TensorFlow', 'Data & ML', ['tensorflow'], 'mlfw'], ['PyTorch', 'Data & ML', ['pytorch'], 'mlfw'], ['Keras', 'Data & ML', ['keras'], 'mlfw'],
    ['Machine Learning', 'Data & ML', ['machine learning', 'ml', 'ai/ml', 'supervised learning', 'predictive modeling', 'predictive modelling'], 'mlcore'],
    ['Deep Learning', 'Data & ML', ['deep learning', 'neural network', 'neural networks', 'cnn'], 'mlcore'],
    ['NLP', 'Data & ML', ['nlp', 'natural language processing'], 'mlcore'],
    ['Computer Vision', 'Data & ML', ['computer vision', 'opencv', 'image processing'], 'mlcore'],
    ['LLMs & GenAI', 'Data & ML', ['llm', 'llms', 'large language model', 'large language models', 'generative ai', 'gen ai', 'prompt engineering', 'langchain', 'openai api'], 'mlcore'],
    ['Data Analysis', 'Data & ML', ['data analysis', 'data analytics', 'analytics', 'exploratory data analysis', 'eda', 'analysing', 'analyzing'], 'analytics'],
    ['Data Visualization', 'Data & ML', ['data visualization', 'data visualisation', 'visualization', 'visualisation', 'visualising', 'visualizing', 'dashboards', 'dashboard'], 'viz'],
    ['Statistics', 'Data & ML', ['statistics', 'statistical', 'hypothesis testing', 'regression'], 'analytics'],
    ['Data Cleaning & ETL', 'Data & ML', ['etl', 'data cleaning', 'data wrangling', 'data pipeline', 'data pipelines', 'data processing'], 'analytics'],
    ['Tableau', 'Data & ML', ['tableau'], 'viz'], ['Power BI', 'Data & ML', ['power bi', 'powerbi'], 'viz'],
    ['Excel', 'Data & ML', ['excel', 'ms excel', 'spreadsheets'], 'analytics'], ['Jupyter', 'Data & ML', ['jupyter', 'jupyter notebook', 'colab'], 'pydata'],
    ['Spark / Big Data', 'Data & ML', ['spark', 'pyspark', 'hadoop', 'big data'], 'bigdata'],
    ['MLOps / Deployment', 'Data & ML', ['mlops', 'model deployment', 'model serving'], 'devops'],
    ['Git', 'Tools', ['git'], 'vcs'], ['GitHub', 'Tools', ['github'], 'vcs'], ['Linux', 'Tools', ['linux', 'unix'], 'os'],
    ['Docker', 'Tools', ['docker', 'containers', 'containerization'], 'devops'], ['Kubernetes', 'Tools', ['kubernetes', 'k8s'], 'devops'],
    ['AWS', 'Tools', ['aws', 'amazon web services'], 'cloud'], ['Azure', 'Tools', ['azure'], 'cloud'], ['GCP', 'Tools', ['gcp', 'google cloud'], 'cloud'],
    ['CI/CD', 'Tools', ['ci/cd', 'github actions', 'jenkins', 'continuous integration'], 'devops'],
    ['Testing', 'Tools', ['unit testing', 'unit tests', 'pytest', 'jest', 'test-driven', 'tdd', 'automated testing'], 'quality'],
    ['LaTeX', 'Tools', ['latex'], 'sci'], ['MATLAB', 'Tools', ['matlab'], 'sci'], ['Origin', 'Tools', ['Origin'], 'sci', 1, true],
    ['Data Structures & Algorithms', 'Computer science', ['data structures', 'algorithms', 'dsa'], 'cs'],
    ['OOP', 'Computer science', ['oop', 'object-oriented', 'object oriented'], 'cs'],
    ['Databases', 'Computer science', ['dbms', 'database design', 'databases', 'database'], 'db'],
    ['System Design', 'Computer science', ['system design', 'software architecture'], 'cs'], ['Agile', 'Computer science', ['agile', 'scrum'], 'process'],
    ['Numerical Methods', 'Science', ['numerical methods', 'numerical analysis', 'numerical'], 'sci'],
    ['Computational Physics', 'Science', ['computational physics', 'physics simulation', 'monte carlo'], 'sci'],
    ['Scientific Computing', 'Science', ['scientific computing', 'scientific computation', 'scientific software', 'simulation', 'simulations'], 'sci'],
    ['Quantum Computing', 'Science', ['quantum computing', 'qiskit', 'quantum mechanics', 'quantum-mechanical'], 'sci'],
    ['Research & Writing', 'Science', ['research', 'scientific writing', 'publication', 'publications', 'poster'], 'research'],
    ['Leadership', 'Professional', ['leadership', 'led a team', 'team lead'], 'soft', .4], ['Communication', 'Professional', ['communication', 'presentation skills', 'presenting'], 'soft', .4],
    ['Teamwork', 'Professional', ['teamwork', 'collaboration', 'cross-functional'], 'soft', .4],
    ['Problem Solving', 'Professional', ['problem solving', 'problem-solving'], 'soft', .4],
    ['Project Management', 'Professional', ['project management', 'stakeholder'], 'soft', .4]
  ].map(([name, cat, aliases, fam, weight = 1, cs = false]) => {
    const body = aliases.map((a) => a.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&').replace(/\s+/g, '[\\s-]+')).join('|');
    // Not preceded/followed by a word char, '+', '#', or (for "." before) a file-extension-like context.
    const re = new RegExp(`(?<![A-Za-z0-9+#.])(?:${body})(?![A-Za-z0-9+#]|\\.[A-Za-z]|\\s?&)`, cs ? 'g' : 'gi');
    return { name, cat, fam, weight, re };
  });
  const SKILL = Object.fromEntries(T.map((s) => [s.name, s]));

  function extractSkills(text) {
    const out = new Map();
    const t = normalizeText(text);
    for (const s of T) {
      s.re.lastIndex = 0;
      const n = (t.match(s.re) || []).length;
      if (n) out.set(s.name, n);
    }
    return out;
  }

  /* ---------- PDF reading (pdf.js loaded on demand) ---------- */
  let pdfJsPromise = null;
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfJsPromise) return pdfJsPromise;
    pdfJsPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = CFG.pdfJs.script; s.async = true; s.crossOrigin = 'anonymous';
      s.onload = () => { if (window.pdfjsLib) { window.pdfjsLib.GlobalWorkerOptions.workerSrc = CFG.pdfJs.worker; resolve(window.pdfjsLib); } else reject(new Error('pdf.js did not initialise')); };
      s.onerror = () => { pdfJsPromise = null; reject(new Error('Could not load the PDF reader (offline or blocked).')); };
      document.head.appendChild(s);
    });
    return pdfJsPromise;
  }
  async function pdfToText(buffer) {
    const bytes = new Uint8Array(buffer);
    if (String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') throw new Error('That file is not a PDF.');
    const pdfjs = await loadPdfJs();
    const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false }).promise;
    const lines = [];
    for (let p = 1; p <= Math.min(doc.numPages, 30); p++) {
      const content = await (await doc.getPage(p)).getTextContent();
      let line = '', lastY = null, lastEnd = null;
      for (const it of content.items) {
        if (typeof it.str !== 'string') continue;
        const y = it.transform[5], x = it.transform[4];
        if (lastY !== null && Math.abs(y - lastY) > 3) { if (line.trim()) lines.push(line.trim()); line = ''; lastEnd = null; }
        if (lastEnd !== null && x - lastEnd > 1.5 && !/\s$/.test(line) && !/^\s/.test(it.str)) line += ' ';
        line += it.str; lastY = y; lastEnd = x + (it.width || 0);
      }
      if (line.trim()) lines.push(line.trim());
    }
    return normalizeText(lines.join('\n'));
  }

  /* ---------- CV parsing ---------- */
  const CV_HEADINGS = ['Summary', 'Education', 'Technical Skills', 'Projects', 'Experience', 'Leadership', 'Certifications', 'Achievements', 'Additional'];
  function segmentCv(text) {
    const seg = {}; let from = 0; const found = [];
    for (const name of CV_HEADINGS) {
      const re = new RegExp(`(^|\\n|\\s)${name}\\b`);
      const m = re.exec(text.slice(from));
      if (m) { const idx = from + m.index + m[1].length; found.push([name, idx]); from = idx + name.length; }
    }
    found.forEach(([name, idx], i) => { seg[name] = text.slice(idx, i + 1 < found.length ? found[i + 1][1] : text.length); });
    seg._ok = found.length >= 4 && !!seg['Technical Skills'];
    return seg;
  }
  const ACTION_VERBS = new Set(('built develop developed design designed implement implemented analyse analysed analyze analyzed create created led lead manage managed apply applied ' +
    'automate automated optimise optimised optimize optimized improve improved reduce reduced train trained deploy deployed research researched perform performed conduct conducted write wrote ' +
    'practise practised practice practiced structure structured coordinate coordinated present presented contribute contributed engineer engineered evaluate evaluated process processed organise organised organize organized ' +
    'participate participated represent represented collaborate collaborated simulate simulated model modelled modeled visualise visualised visualize visualized document documented ship shipped launch launched').split(' '));
  function bulletsOf(text) {
    return text.split(/\n|•|▪|●|•/).map((l) => l.replace(/^[\s\-–*·]+/, '').trim()).filter((l) => words(l) >= 6);
  }
  const stripDates = (s) => s.replace(/\b(19|20)\d{2}\b/g, '').replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/gi, '');
  function cvQuality(text, seg) {
    const body = seg._ok ? [seg.Projects, seg.Experience, seg.Leadership].filter(Boolean).join('\n') : text;
    const bullets = bulletsOf(body);
    const verbs = bullets.filter((b) => ACTION_VERBS.has(b.split(/[\s:,]/)[0].toLowerCase())).length;
    const quant = bullets.filter((b) => /\d/.test(stripDates(b).replace(/\bcgpa\b.*$/i, ''))).length;
    return { bullets: bullets.length, verbs, quant, words: words(text), hasSummary: !!(seg.Summary && words(seg.Summary) >= 25) };
  }

  /* ---------- imports (LinkedIn / Coursera) ---------- */
  const STORE_KEY = 'careerlab-imports-v1';
  const emptyImports = () => ({ linkedin: { skills: [], certs: [], positions: [], via: '' }, coursera: { certs: [], via: '' } });
  function sanitizeCerts(list) {
    return (Array.isArray(list) ? list : []).slice(0, 200).map((c) => {
      const url = c && c.url ? safeHttps(String(c.url)) : null;
      return { name: clean(c && c.name, 160), issuer: clean(c && c.issuer, 120), date: clean(c && c.date, 24), url: url ? url.href.slice(0, 500) : '', source: clean(c && c.source, 20) };
    }).filter((c) => c.name);
  }
  function sanitizeImports(raw) {
    const out = emptyImports();
    try {
      const li = raw && raw.linkedin || {}, co = raw && raw.coursera || {};
      out.linkedin.skills = (Array.isArray(li.skills) ? li.skills : []).slice(0, 300).map((s) => clean(s, 80)).filter(Boolean);
      out.linkedin.certs = sanitizeCerts(li.certs).map((c) => ({ ...c, source: 'linkedin' }));
      out.linkedin.positions = (Array.isArray(li.positions) ? li.positions : []).slice(0, 100).map((p) => ({ title: clean(p && p.title, 120), company: clean(p && p.company, 120) })).filter((p) => p.title);
      out.linkedin.via = clean(li.via, 20);
      out.coursera.certs = sanitizeCerts(co.certs).map((c) => ({ ...c, issuer: c.issuer || 'Coursera', source: 'coursera' }));
      out.coursera.via = clean(co.via, 20);
    } catch (_) { /* fall through with empty */ }
    return out;
  }
  let imports = (() => { try { return sanitizeImports(JSON.parse(localStorage.getItem(STORE_KEY) || 'null')); } catch (_) { return emptyImports(); } })();
  function saveImports() { try { localStorage.setItem(STORE_KEY, JSON.stringify(imports)); } catch (_) { /* storage blocked: state stays in memory */ } }
  const allCerts = () => [...imports.linkedin.certs, ...imports.coursera.certs];
  const hasImports = () => allCerts().length || imports.linkedin.skills.length || imports.linkedin.positions.length;

  function parseCsv(text) {
    const rows = []; let row = [], cell = '', q = false;
    const src = String(text).replace(/^﻿/, '');
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (q) { if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && src[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim()));
  }
  function classifyCsv(rows) {
    // LinkedIn exports sometimes start with note lines; find the header row.
    const hi = rows.findIndex((r) => r.map((x) => x.trim().toLowerCase()).some((x) => ['name', 'title', 'company name'].includes(x)));
    if (hi < 0) return null;
    const head = rows[hi].map((x) => x.trim().toLowerCase());
    const col = (n) => head.indexOf(n);
    const data = rows.slice(hi + 1);
    if (col('authority') >= 0 || col('license number') >= 0) {
      return { type: 'certs', items: data.map((r) => ({ name: r[col('name')], issuer: r[col('authority')], url: r[col('url')], date: r[col('finished on')] || r[col('started on')] })) };
    }
    if (col('company name') >= 0 && col('title') >= 0) return { type: 'positions', items: data.map((r) => ({ title: r[col('title')], company: r[col('company name')] })) };
    if (col('name') >= 0 && head.length <= 2) return { type: 'skills', items: data.map((r) => r[col('name')]) };
    return null;
  }
  const COURSERA_HOST = /^(www\.)?coursera\.org$/i;
  function parseCourseraLines(text) {
    return String(text).split(/\n/).map((l) => l.trim()).filter(Boolean).slice(0, 200).map((line) => {
      const m = line.match(/https?:\/\/\S+/i);
      const name = clean((m ? line.replace(m[0], '') : line).replace(/^[\s|:\-–—,;]+|[\s|:\-–—,;]+$/g, ''), 160);
      let url = '', status = 'unverified';
      if (m) {
        const u = safeHttps(m[0].replace(/[),.;]+$/, ''));
        if (u && COURSERA_HOST.test(u.hostname) && /^\/(account\/accomplishments\/|verify\/|learn\/|specializations\/|professional-certificates\/)/.test(u.pathname)) { url = u.href; status = 'link'; }
        else status = 'rejected';
      }
      return { name: name || (url ? 'Coursera credential' : ''), url, status, issuer: 'Coursera', source: 'coursera' };
    }).filter((c) => c.name && c.status !== 'rejected');
  }
  const certSkillText = () => [...allCerts().map((c) => c.name), ...imports.linkedin.positions.map((p) => p.title)].join('\n');

  /* ---------- baseline: CV + site + imports ---------- */
  let baselinePromise = null;
  const $P = (sel) => $$(sel, document).filter((e) => !root.contains(e));
  const $P1 = (sel) => $P(sel)[0] || null;
  const siteText = (sel) => $$(sel, document).map((el) => el.textContent).join('\n');
  function resetBaseline() { baselinePromise = null; }
  function getBaseline() {
    if (baselinePromise) return baselinePromise;
    baselinePromise = (async () => {
      let cvText = '', source = 'snapshot';
      try {
        if (/^https?:$/.test(location.protocol) && CFG.cvUrl) {
          const res = await fetch(CFG.cvUrl, { cache: 'no-cache' });
          if (res.ok) { cvText = await pdfToText(await res.arrayBuffer()); source = 'live'; }
        }
      } catch (_) { /* fall back to snapshot */ }
      if (words(cvText) < 80) { cvText = normalizeText(CFG.cvSnapshot || ''); source = 'snapshot'; }
      const seg = segmentCv(cvText);
      const skills = new Map();
      const add = (name, src, evidenced) => {
        const s = skills.get(name) || { sources: new Set(), strength: 0 };
        s.sources.add(src); s.strength = Math.max(s.strength, evidenced ? 2 : 1); skills.set(name, s);
      };
      const evidenceCv = seg._ok ? [seg.Projects, seg.Experience, seg.Leadership, seg.Certifications].join('\n') : '';
      const cvAll = extractSkills(cvText), cvEv = extractSkills(evidenceCv);
      for (const name of cvAll.keys()) add(name, 'CV', cvEv.has(name));
      const siteEv = extractSkills(siteText('#project, #exper, #current-work'));
      for (const name of siteEv.keys()) add(name, 'site', true);
      for (const name of extractSkills(siteText('#credentials .cred-item h4')).keys()) add(name, 'credentials', true);
      for (const name of extractSkills(siteText('#skills .skilltags')).keys()) add(name, 'site', siteEv.has(name));
      for (const name of imports.linkedin.skills) { const k = [...extractSkills(name).keys()]; k.forEach((n) => add(n, 'LinkedIn', false)); }
      for (const name of extractSkills(certSkillText()).keys()) add(name, 'credentials', true);
      return { cvText, seg, source, skills, quality: cvQuality(cvText, seg), cvSkills: new Set(cvAll.keys()) };
    })();
    return baselinePromise;
  }
  const strengthOf = (base, name) => (base.skills.get(name) || { strength: 0 }).strength;

  /* ---------- 1. PORTFOLIO EVALUATOR ---------- */
  const PLACEHOLDER = /lorem ipsum|\bTODO\b|\bTBD\b|your name here|coming soon|insert (?:text|image)|placeholder text|sample text/i;
  const SUPERLATIVE = /\b(world-class|rockstar|ninja|guru|hard-?working|results-driven|passionate about|expert in|best-in-class)\b/gi;
  const AI_TERMS = /\b(ai|ml|machine learning|tensorflow|pytorch|scikit|openai|llm|gemini|nlp|model|recommend)/i;

  function check(label, max, score, evidence, fix) { return { label, max, score: clamp(score, 0, max), evidence, fix }; }
  const ratioCheck = (label, max, n, d, evidence, fix) => check(label, max, d ? max * n / d : 0, evidence, fix);

  async function fetchSameOriginPages() {
    if (!/^https?:$/.test(location.protocol)) return { checked: false, pages: [] };
    const linked = new Set($P('a[href]').map((a) => a.getAttribute('href')).filter((u) => /^[\w\-./]+\.html$/.test(u) && !/^index\.html$/.test(u)));
    const extra = (CFG.pagesToCheck || []).filter((u) => !linked.has(u));
    const out = [];
    for (const href of [...linked, ...extra]) {
      try {
        const r = await fetch(href, { cache: 'no-cache' });
        const text = r.ok ? await r.text() : '';
        const body = (text.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || [, text])[1].replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ');
        out.push({ href, linked: linked.has(href), ok: r.ok, words: words(body), redirect: /http-equiv=["']refresh["']/i.test(text), title: ((text.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').trim() });
      } catch (_) { out.push({ href, linked: linked.has(href), ok: false, words: 0, redirect: false, title: '' }); }
    }
    return { checked: true, pages: out };
  }

  async function evaluatePortfolio() {
    const base = await getBaseline();
    const imported = allCerts();
    const pageText = (() => { const c = document.body.cloneNode(true); c.querySelectorAll('#career-lab, script, style').forEach((n) => n.remove()); return c.textContent; })();
    const crit = [];
    const deductions = [];
    const pages = await fetchSameOriginPages();

    // A. Project evidence
    const cards = $P('.project-card');
    const caseTexts = $P('.case-study-card').map((d) => d.textContent);
    const projectInfo = cards.map((card) => {
      const name = card.dataset.projectName || card.querySelector('h3')?.textContent || 'Project';
      const dialogId = card.querySelector('[aria-controls]')?.getAttribute('aria-controls');
      const dialog = dialogId ? document.getElementById(dialogId) : null;
      const links = [...card.querySelectorAll('a[href]'), ...(dialog ? dialog.querySelectorAll('a[href]') : [])].map((a) => a.href);
      const repo = links.some((l) => /github\.com\/[^/]+\/[^/]+/i.test(l));
      const live = links.some((l) => /^https?:/i.test(l) && !/github\.com/i.test(l) && l.split('#')[0] !== location.href.split('#')[0]);
      const desc = card.querySelector('.project-body p')?.textContent || '';
      const tags = card.querySelectorAll('.tech-tags span').length;
      const key = name.split(/\s|—/)[0].toLowerCase();
      const cs = caseTexts.find((t) => t.toLowerCase().includes(key)) || '';
      const textAll = `${card.textContent} ${cs} ${dialog ? dialog.textContent : ''}`;
      const quant = /\d+(?:\.\d+)?\s?(?:%|x\b|ms\b|seconds|users|records|rows|datasets|samples|files|hours|orders|variables|equations)/i.test(textAll);
      const shot = !!card.querySelector('img[alt]:not([alt=""])');
      return { name, repo, live, wordsDesc: words(desc), tags, hasCase: !!cs, quant, shot, title: card.querySelector('h3')?.textContent || '', tagText: [...card.querySelectorAll('.tech-tags span')].map((s) => s.textContent).join(' '), textAll };
    });
    const n = projectInfo.length || 1;
    const cnt = (f) => projectInfo.filter(f).length;
    crit.push({
      name: 'Project evidence', weight: 25, checks: [
        ratioCheck('Every project links to its source code', 4, cnt((p) => p.repo), n, `${cnt((p) => p.repo)}/${projectInfo.length} projects link to a GitHub repository.`, 'Add a repository link to each project card.'),
        ratioCheck('Every project has a working live demo or screenshots', 4, cnt((p) => p.live || p.shot), n, `${cnt((p) => p.live)} live demo link(s), ${cnt((p) => p.shot)} real screenshot(s) across ${projectInfo.length} projects. Cards currently use illustrated mock visuals, not screenshots.`, 'Deploy each project (GitHub Pages/Netlify/Streamlit) or add a real screenshot or short GIF with descriptive alt text.'),
        ratioCheck('Descriptions say what was built (15+ words)', 2, cnt((p) => p.wordsDesc >= 15), n, `${cnt((p) => p.wordsDesc >= 15)}/${projectInfo.length} descriptions have 15+ words.`, 'Expand short descriptions: problem, approach, result.'),
        ratioCheck('Tech stack is named (3+ tags)', 2, cnt((p) => p.tags >= 3), n, `${cnt((p) => p.tags >= 3)}/${projectInfo.length} projects list 3+ technologies.`, 'List the main languages, libraries and tools used.'),
        ratioCheck('Case study written', 3, cnt((p) => p.hasCase), n, `${cnt((p) => p.hasCase)}/${projectInfo.length} projects have a case study.`, 'Write a short case study: problem, approach, outcome.'),
        ratioCheck('Measurable outcome stated', 6, cnt((p) => p.quant), n, `${cnt((p) => p.quant)}/${projectInfo.length} projects state a measurable result (a number with a unit).`, 'Add one real, checkable number per project: dataset size, runtime, accuracy vs. a baseline, test count, users. Only use figures you can back up.')
      ]
    });
    projectInfo.forEach((p) => {
      if (/\bAI\b|\bML\b|machine learning/i.test(p.title) && !AI_TERMS.test(p.tagText) && !/\b(model|scikit|tensorflow|pytorch|openai|api)\b/i.test(p.textAll)) {
        deductions.push({ label: `"${p.title}" claims AI but names no AI/ML technology`, points: 3, evidence: `Tags: ${p.tagText || 'none'}. No model, library or API is mentioned on the card or in its case study.`, fix: 'Name the model/library/API actually used (and what it does), or reword the title.' });
      }
    });

    // B. Skills credibility
    const listedSkills = $P('#skills .skilltags span').map((s) => s.textContent.trim());
    const listedNames = new Set(listedSkills.flatMap((s) => [...extractSkills(s).keys()]));
    const evidenceText = siteText('#project, #exper');
    const evSkills = new Set(extractSkills(evidenceText).keys());
    const backed = [...listedNames].filter((s) => evSkills.has(s));
    const unbacked = [...listedNames].filter((s) => !evSkills.has(s));
    const cvOnly = [...base.cvSkills].filter((s) => !listedNames.has(s) && SKILL[s].weight === 1);
    const cvCovered = base.cvSkills.size ? (base.cvSkills.size - cvOnly.length) / base.cvSkills.size : 0;
    crit.push({
      name: 'Skills credibility', weight: 15, checks: [
        ratioCheck('Listed skills are backed by project or experience text', 8, backed.length, listedNames.size, `${backed.length}/${listedNames.size} listed skills appear in project/experience text.${unbacked.length ? ' Not evidenced: ' + unbacked.join(', ') + '.' : ''}`, `Show where you used ${unbacked.slice(0, 3).join(', ') || 'each skill'} (a project tag, a bullet, or a repo link) or remove it from the list.`),
        check('Skills list is focused (8-30 items)', 2, listedSkills.length >= 8 && listedSkills.length <= 30 ? 2 : listedSkills.length >= 5 ? 1 : 0, `${listedSkills.length} skills listed.`, 'Aim for 8-30 skills you can discuss in an interview.'),
        check('Skills are linked to evidence (interactive map)', 2, $P('.skill-node').length >= 5 ? 2 : 0, `${$P('.skill-node').length} skills have an evidence link.`, 'Link more skills to the project that proves them.'),
        check('Website skills match the CV', 3, 3 * cvCovered, `${Math.round(cvCovered * 100)}% of skills found in the CV also appear in the website skills section.${cvOnly.length ? ' On the CV only: ' + cvOnly.slice(0, 8).join(', ') + '.' : ''}`, `Add the CV skills you can back up (${cvOnly.slice(0, 5).join(', ')}) to the website, or trim the CV.`)
      ]
    });

    // C. Experience & impact
    const exps = $P('.expercard');
    const bullets = exps.flatMap((e) => [...e.querySelectorAll('li')].map((li) => li.textContent.trim()));
    const verbOk = bullets.filter((b) => ACTION_VERBS.has(b.split(/[\s:,]/)[0].toLowerCase())).length;
    const quantB = bullets.filter((b) => /\d/.test(stripDates(b))).length;
    crit.push({
      name: 'Experience & impact', weight: 15, checks: [
        ratioCheck('Entries carry dates', 3, exps.filter((e) => e.querySelector('.experience-date')).length, exps.length || 1, `${exps.filter((e) => e.querySelector('.experience-date')).length}/${exps.length} entries have dates.`, 'Add start/end dates.'),
        ratioCheck('Entries name role and organisation', 2, exps.filter((e) => e.querySelector('h3') && e.querySelector('.expmeta')).length, exps.length || 1, `${exps.filter((e) => e.querySelector('h3') && e.querySelector('.expmeta')).length}/${exps.length} entries have both.`, 'Add organisation to each entry.'),
        ratioCheck('Bullets start with an action verb', 3, verbOk, bullets.length || 1, `${verbOk}/${bullets.length} bullets start with an action verb.`, 'Start bullets with verbs such as Built, Analysed, Automated.'),
        ratioCheck('Bullets show measurable impact', 5, quantB, bullets.length || 1, `${quantB}/${bullets.length} bullets contain a number.`, 'Add real numbers to bullets: rows processed, time saved, accuracy, files handled. Estimate only if you label it.'),
        check('At least three entries', 2, exps.length >= 3 ? 2 : exps.length >= 2 ? 1 : 0, `${exps.length} entries.`, 'Add research, hackathon or open-source work if you have it.')
      ]
    });

    // D. Credentials & verification
    const credItems = $P('#credentials .cred-item');
    const credLinks = $P('#credentials a[href]').map((a) => a.href);
    const verifiable = credItems.filter((c) => c.querySelector('a.cred-verify'));
    const issuerCount = credItems.filter((c) => (c.querySelector('.cred-issuer')?.textContent || '').trim()).length;
    const verifiedImports = imported.filter((c) => c.url);
    const totalCreds = credItems.length + imported.length;
    crit.push({
      name: 'Credentials & verification', weight: 10, checks: [
        check('Credentials are named with issuer and date', 3, clamp((issuerCount + imported.filter((c) => c.issuer).length) / 8, 0, 1) * 3, `${credItems.length} credential entries on the page${imported.length ? ` plus ${imported.length} imported` : ''}.`, 'List each certification with its issuer and date, or import them from LinkedIn (Connect profiles tab).'),
        check('Credentials link to an issuer verification page', 4, totalCreds ? 4 * (verifiable.length + verifiedImports.length) / totalCreds : 0, `${verifiable.length}/${credItems.length} entries link to a verification page${verifiedImports.length ? `; ${verifiedImports.length} imported with URLs` : ''}.`, 'Add the issuer verification link (Credly, Coursera verify, certificate URL) to each entry that has one.'),
        check('Profile link to the full list', 3, credLinks.some((l) => /linkedin\.com/i.test(l)) ? 3 : 0, credLinks.some((l) => /linkedin\.com/i.test(l)) ? 'LinkedIn certifications link present.' : 'No link.', 'Link to your LinkedIn certifications page.')
      ]
    });

    // E. Positioning & clarity
    const h1s = $P('h1');
    const hero = $P1('.hero-copy')?.textContent || '';
    const about = $P1('#about')?.textContent || '';
    crit.push({
      name: 'Positioning & clarity', weight: 10, checks: [
        check('Headline names the role/direction', 2, /software|data|ai|ml|engineer|developer|scientist/i.test(document.title) ? 2 : 0, `Title: "${document.title}".`, 'Put the role and focus areas in the page title.'),
        check('Hero statement is concise (15-45 words)', 2, words(hero) >= 15 && words(hero) <= 45 ? 2 : 1, `${words(hero)} words.`, 'Keep the hero statement to one or two sentences.'),
        check('About section is substantive (40+ words)', 2, words(about) >= 40 ? 2 : 1, `${words(about)} words.`, 'Say who you are, what you build, and what you are looking for.'),
        check('Clear next actions (projects + resume)', 2, $P1('a[href="#project"]') && $P1('a[href$="resume.pdf"]') ? 2 : 1, 'Projects and résumé buttons found in the hero.', 'Offer both a projects and a résumé call to action.'),
        check('Seeking intent is explicit', 2, /internship|seeking|looking for|open to/i.test(pageText) ? 2 : 0, /internship|seeking|looking for|open to/i.test(pageText) ? 'Mentions internship/seeking intent.' : 'No statement.', 'State the kind of internship or role you want and your availability.')
      ]
    });

    // F. Accessibility & technical quality
    const imgs = $P('img');
    const noAlt = imgs.filter((i) => !i.hasAttribute('alt'));
    const hLevels = $P('h1,h2,h3,h4').map((e) => +e.tagName[1]);
    let skips = 0; hLevels.forEach((l, i) => { if (i && l - hLevels[i - 1] > 1) skips++; });
    const blank = $P('a[target="_blank"]');
    const noRel = blank.filter((a) => !/noopener/.test(a.rel));
    const fields = $P('input:not([type=hidden]):not([type=submit]), textarea, select');
    const unlabeled = fields.filter((f) => !(f.id && document.querySelector(`label[for="${CSS.escape(f.id)}"]`)) && !f.closest('label') && !f.getAttribute('aria-label') && !f.getAttribute('aria-labelledby'));
    crit.push({
      name: 'Accessibility & technical quality', weight: 10, checks: [
        check('Language and viewport declared', 1, document.documentElement.lang && document.querySelector('meta[name=viewport]') ? 1 : 0, `lang="${document.documentElement.lang}".`, 'Set <html lang> and a viewport meta tag.'),
        check('Meta description present', 1, document.querySelector('meta[name=description]')?.content?.length > 50 ? 1 : 0, 'Meta description checked.', 'Add a 120-160 character meta description.'),
        ratioCheck('Every image has alt text', 2, imgs.length - noAlt.length, imgs.length || 1, `${imgs.length - noAlt.length}/${imgs.length} images have an alt attribute.`, 'Add alt text to every image.'),
        check('Single h1 and no skipped heading levels', 2, (h1s.length === 1 ? 1 : 0) + (skips === 0 ? 1 : 0), `${h1s.length} <h1> elements, ${skips} skipped heading level(s).`, 'Use one h1 and step headings down one level at a time.'),
        ratioCheck('External links use rel="noopener"', 1, blank.length - noRel.length, blank.length || 1, `${blank.length - noRel.length}/${blank.length} new-tab links are safe.`, 'Add rel="noopener noreferrer".'),
        ratioCheck('Form fields are labelled', 1, fields.length - unlabeled.length, fields.length || 1, `${fields.length - unlabeled.length}/${fields.length} fields labelled.`, 'Associate each input with a label.'),
        check('Social preview tags (Open Graph)', 2, document.querySelector('meta[property="og:title"]') && document.querySelector('meta[property="og:image"]') ? 2 : 0, document.querySelector('meta[property="og:title"]') ? 'og:title found.' : 'No og:title / og:image.', 'Add og:title, og:description and og:image so links preview well.')
      ]
    });

    // G. Contact & discoverability
    const hasHref = (re) => $P('a[href]').some((a) => re.test(a.href));
    crit.push({
      name: 'Contact & discoverability', weight: 5, checks: [
        check('Résumé link', 1, hasHref(/resume\.pdf/i) ? 1 : 0, 'Checked.', 'Link your résumé.'),
        check('LinkedIn link', 1, hasHref(/linkedin\.com\/in\//i) ? 1 : 0, 'Checked.', 'Link LinkedIn.'),
        check('GitHub link', 1, hasHref(/github\.com\/[^/]+\/?$/i) ? 1 : 0, 'Checked.', 'Link GitHub.'),
        check('Contact route', 1, document.querySelector('form') || hasHref(/^mailto:/i) ? 1 : 0, 'Form or mailto found.', 'Add a contact route.'),
        check('Canonical URL', 1, document.querySelector('link[rel=canonical]') ? 1 : 0, document.querySelector('link[rel=canonical]') ? 'Canonical link present.' : 'No canonical link.', 'Add a canonical URL once the site is deployed.')
      ]
    });

    // H. Completeness & maintenance
    const perCard = cards.map((card) => new Set($$('a[href^="http"]', card).map((a) => a.href)));
    const seenLinks = new Set(); let dup = 0;
    perCard.forEach((set) => { set.forEach((l) => { if (seenLinks.has(l)) dup++; }); set.forEach((l) => seenLinks.add(l)); });
    const content = pages.pages.filter((p) => !p.redirect);
    const thin = content.filter((p) => !p.ok || p.words < 20 || /^document$/i.test(p.title));
    crit.push({
      name: 'Completeness & upkeep', weight: 10, checks: [
        pages.checked && content.length
          ? ratioCheck('Site pages have real content', 5, content.length - thin.length, content.length, `${content.length - thin.length}/${content.length} site pages have content.${thin.length ? ' Empty or placeholder: ' + thin.map((p) => p.href + (p.linked ? '' : ' (not linked)')).join(', ') + '.' : ''}`, `Fill or delete ${thin.map((p) => p.href).join(', ') || 'empty pages'}; empty files look unfinished if someone finds them.`)
          : check('Site pages have real content', 0, 0, 'Not checked (needs http/https and pages listed in career-config.js).', ''),
        check('Copyright year is current', 2, new RegExp(String(new Date().getFullYear())).test(document.querySelector('body > footer')?.textContent || '') ? 2 : 0, `Current year ${new Date().getFullYear()}.`, 'Update the footer year.'),
        check('Project links are distinct', 3, dup === 0 ? 3 : 0, dup ? `${dup} duplicate project link(s).` : 'All project links distinct.', 'Give each project its own URL.')
      ]
    });

    // Deductions
    const bodyText = pageText.replace(/\s+/g, ' ');
    const ph = bodyText.match(new RegExp(PLACEHOLDER.source, 'gi')) || [];
    if (ph.length) deductions.push({ label: 'Placeholder text on the page', points: Math.min(6, ph.length * 2), evidence: `Found: ${[...new Set(ph.map((s) => s.toLowerCase()))].join(', ')}.`, fix: 'Replace or remove placeholder copy.' });
    pages.pages.filter((p) => p.linked && !p.redirect && (p.words < 20 || /^document$/i.test(p.title))).slice(0, 2).forEach((p) => deductions.push({ label: `Linked page "${p.href}" is empty or untitled`, points: 3, evidence: `${p.words} words, title "${p.title || 'none'}".`, fix: `Build out ${p.href} or remove the link to it.` }));
    const sup = bodyText.match(SUPERLATIVE) || [];
    if (sup.length) deductions.push({ label: 'Unsupported superlatives', points: Math.min(3, sup.length), evidence: `Found: ${[...new Set(sup.map((s) => s.toLowerCase()))].join(', ')}.`, fix: 'Replace adjectives with evidence.' });
    if (typeof flpcPhotos !== 'undefined' && Array.isArray(flpcPhotos)) {
      const caps = flpcPhotos.map((p) => p.caption), dupCaps = caps.length - new Set(caps).size;
      const generic = flpcPhotos.filter((p) => /photograph \d|photo \d/i.test(`${p.alt} ${p.caption}`)).length;
      if (dupCaps || generic) deductions.push({ label: 'Gallery captions/alt text are generic or duplicated', points: 2, evidence: `${generic} of ${flpcPhotos.length} FLPC photos use placeholder-style captions; ${dupCaps} caption(s) repeat.`, fix: 'Describe each photo in the flpcPhotos array.' });
    }
    const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc);
    if (broken.length) deductions.push({ label: 'Broken images', points: Math.min(4, broken.length * 2), evidence: broken.map((i) => i.getAttribute('src')).slice(0, 4).join(', '), fix: 'Fix or remove broken image paths.' });

    // Score
    let weighted = 0;
    crit.forEach((c) => {
      const max = c.checks.reduce((a, k) => a + k.max, 0), got = c.checks.reduce((a, k) => a + k.score, 0);
      c.earned = max ? c.weight * got / max : c.weight; c.max = max;
      c.checks.forEach((k) => { k.gain = max ? c.weight * (k.max - k.score) / max : 0; });
      weighted += c.earned;
    });
    const ded = Math.min(15, deductions.reduce((a, d) => a + d.points, 0));
    const score = Math.round(clamp(weighted - ded, 0, 100));
    const actions = [
      ...crit.flatMap((c) => c.checks.filter((k) => k.max > 0 && k.gain >= 0.4 && k.fix).map((k) => ({ title: k.label, fix: k.fix, gain: k.gain, area: c.name }))),
      ...deductions.map((d) => ({ title: d.label, fix: d.fix, gain: d.points, area: 'Deduction' }))
    ].sort((a, b) => b.gain - a.gain).slice(0, 8);
    const band = score >= 85 ? 'Excellent' : score >= 70 ? 'Strong' : score >= 55 ? 'Developing' : 'Needs work';
    return { score, band, weighted: round1(weighted), ded, crit, deductions, actions, base };
  }

  /* ---------- 2. CV COMPARISON ---------- */
  const SECTION_HINT = { preferred: /preferred|nice to have|good to have|bonus|a plus|desirable/i, required: /requirements?|required|must[- ]have|qualifications|what you.?ll need|responsibilities|you will|skills/i };
  function analyseTarget(text) {
    const lines = text.split('\n'); let mode = 'normal'; const w = new Map(), counts = new Map();
    lines.forEach((line) => {
      if (SECTION_HINT.preferred.test(line) && words(line) <= 8) mode = 'preferred';
      else if (SECTION_HINT.required.test(line) && words(line) <= 8) mode = 'required';
      const found = extractSkills(line);
      found.forEach((c, name) => {
        counts.set(name, (counts.get(name) || 0) + c);
        const base = mode === 'preferred' ? 0.6 : mode === 'required' ? 1.3 : 1;
        w.set(name, Math.max(w.get(name) || 0, base));
      });
    });
    const out = new Map();
    w.forEach((base, name) => out.set(name, { importance: round1((base + Math.min(counts.get(name) - 1, 4) * 0.25) * SKILL[name].weight), count: counts.get(name) }));
    return out;
  }
  async function compareToTarget(targetText, mode, label) {
    const base = await getBaseline();
    const target = analyseTarget(targetText);
    const rows = [...target.entries()].map(([name, t]) => {
      const strength = strengthOf(base, name);
      const adj = strength ? null : T.filter((s) => s.fam === SKILL[name].fam && s.name !== name && strengthOf(base, s.name) > 0).map((s) => s.name);
      return { name, ...t, strength, adjacent: adj && adj.length ? adj : null };
    }).sort((a, b) => b.importance - a.importance);
    const total = rows.reduce((a, r) => a + r.importance, 0);
    const got = rows.reduce((a, r) => a + r.importance * (r.strength === 2 ? 1 : r.strength === 1 ? 0.6 : r.adjacent ? 0.25 : 0), 0);
    const score = total ? Math.round(100 * got / total) : 0;
    const strong = rows.filter((r) => r.strength === 2), listed = rows.filter((r) => r.strength === 1), missing = rows.filter((r) => !r.strength);
    const targetNames = new Set(rows.map((r) => r.name));
    const extras = [...base.skills.entries()].filter(([name, v]) => v.strength === 2 && !targetNames.has(name) && SKILL[name].weight === 1).map(([name]) => name).slice(0, 14);
    const notes = [];
    const yrs = [...targetText.matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs)\b/gi)].map((m) => +m[1]).filter((y) => y > 0 && y < 15);
    if (yrs.length && Math.max(...yrs) >= 2 && mode === 'jd') notes.push(`The posting mentions ${Math.max(...yrs)}+ years of experience. Your CV documents internships, research and projects, so lead with project evidence and apply if the core skills match.`);
    const suggestions = [];
    missing.filter((r) => r.importance >= 1).slice(0, 4).forEach((r) => {
      suggestions.push(r.adjacent
        ? { kind: 'Close gap', text: `${r.name} is asked for. You already show ${r.adjacent.slice(0, 2).join(' and ')}, which is closely related. If you have used ${r.name}, add it to a project; otherwise a short project with it would close the gap quickly.` }
        : { kind: 'Gap', text: `${r.name} is asked for${r.importance >= 1.3 ? ' as a core requirement' : ''} and is not on your CV. Learn it through a small project and add it only once you can discuss it.` });
    });
    listed.slice(0, 3).forEach((r) => suggestions.push({ kind: 'Show proof', text: `${r.name} appears only in your skills list. Add it to a project or experience bullet so the claim has evidence.` }));
    const q = base.quality;
    if (q.bullets && q.quant / q.bullets < 0.25) suggestions.push({ kind: 'Impact', text: `Only ${q.quant} of ${q.bullets} project/experience bullets in your CV contain a number. Add real figures (data size, accuracy, runtime) where you have them.` });
    if (q.bullets && q.verbs / q.bullets < 0.6) suggestions.push({ kind: 'Wording', text: `${q.verbs} of ${q.bullets} bullets open with an action verb. Start each with one (Built, Analysed, Automated).` });
    if (rows.length) suggestions.push({ kind: 'Keywords', text: `Mirror the posting's wording only for skills you really have. The strongest matches to feature near the top: ${strong.slice(0, 5).map((r) => r.name).join(', ') || 'none yet'}.` });
    return { score, rows, strong, listed, missing, extras, notes, suggestions, mode, label, base };
  }

  /* ---------- 3. RECOMMENDATIONS ---------- */
  const TRACKS = {
    'ai-ml': { label: 'AI / Machine Learning', core: { 'Machine Learning': 3, Python: 3, 'Deep Learning': 2, 'Scikit-learn': 2, PyTorch: 2, TensorFlow: 2, NumPy: 1, Pandas: 1, Statistics: 1.5, NLP: 1, 'LLMs & GenAI': 1, 'Computer Vision': 1, Git: .5 },
      roles: [['Machine Learning Intern', 'machine learning intern'], ['AI Engineer Intern', 'AI engineer intern'], ['Research Intern, applied ML', 'machine learning research intern']] },
    data: { label: 'Data analysis / science', core: { Python: 2, SQL: 3, Pandas: 2, 'Data Analysis': 3, 'Data Visualization': 2, Statistics: 2, Excel: 1, Tableau: 1.5, 'Power BI': 1.5, Matplotlib: 1, Seaborn: 1 },
      roles: [['Data Analyst Intern', 'data analyst intern'], ['Data Science Intern', 'data science intern'], ['Business Intelligence Intern', 'business intelligence intern']] },
    sci: { label: 'Scientific computing / research software', core: { Python: 2, NumPy: 2, SciPy: 2, 'Numerical Methods': 2, 'Computational Physics': 2, 'Scientific Computing': 2, Matplotlib: 1, C: 1, 'C++': 1, MATLAB: 1, LaTeX: 1, 'Research & Writing': 1, Linux: 1, Git: 1 },
      roles: [['Research Software Engineer Intern', 'research software engineer intern'], ['Scientific Programmer Intern', 'scientific computing intern'], ['Computational Physics Research Intern', 'computational physics research intern']] },
    web: { label: 'Full-stack / front-end', core: { JavaScript: 3, HTML: 2, CSS: 2, React: 3, 'Node.js': 2, MongoDB: 1, 'REST APIs': 2, Git: 1, TypeScript: 1.5, Testing: 1 },
      roles: [['Frontend Developer Intern', 'frontend developer intern'], ['Full Stack Developer Intern', 'full stack developer intern'], ['React Developer Intern', 'react developer intern']] }
  };
  const PROJECTS = [
    { id: 'materials', title: 'Materials property predictor', tracks: ['ai-ml', 'sci'], skills: ['Python', 'Scikit-learn', 'Pandas', 'Machine Learning', 'Matplotlib', 'Jupyter'], weeks: 3, builds: 'AI/ML Materials Prediction research', pitch: 'Train and compare baseline models on a public materials dataset, with cross-validation and error analysis.', deliver: 'Reproducible notebook, a short model card, and a plot of model vs. baseline error.' },
    { id: 'marine-dash', title: 'Marine dataset dashboard', tracks: ['data'], skills: ['Python', 'Pandas', 'Streamlit', 'Data Visualization', 'Statistics'], weeks: 2, builds: 'Marine Data Analysis Tool', pitch: 'Turn your Marine Data Analysis workflows into an interactive, deployed dashboard.', deliver: 'Live Streamlit link plus 3 documented findings with numbers.' },
    { id: 'bake-ml', title: 'BakeVerse recommendation model', tracks: ['ai-ml', 'web'], skills: ['Python', 'Scikit-learn', 'REST APIs', 'JavaScript', 'Machine Learning'], weeks: 3, builds: 'BakeVerse', pitch: 'Add a real recommender (content-based filtering) to BakeVerse behind a small API, so its "AI-integrated" claim is backed by code.', deliver: 'Model + API endpoint + before/after click-through on sample data.' },
    { id: 'numerics', title: 'Numerical methods library with tests', tracks: ['sci'], skills: ['Python', 'NumPy', 'SciPy', 'Numerical Methods', 'Testing', 'Matplotlib'], weeks: 3, builds: 'Physics Simulator', pitch: 'Re-implement orbital and oscillator solvers (Euler, RK4) and plot convergence against analytic solutions.', deliver: 'Package with unit tests, convergence plots and a README.' },
    { id: 'sql-case', title: 'SQL analytics case study', tracks: ['data'], skills: ['SQL', 'Pandas', 'Data Analysis', 'Tableau', 'Statistics'], weeks: 2, builds: 'new', pitch: 'Pick a public dataset, answer five business questions in SQL, and visualise the findings.', deliver: 'Query file, dashboard link and a one-page write-up.' },
    { id: 'pipeline-ci', title: 'Experiment-data pipeline with CI', tracks: ['sci', 'data', 'web'], skills: ['Python', 'Testing', 'CI/CD', 'Git', 'Docker', 'Pandas'], weeks: 2, builds: 'Academic Automation', pitch: 'Package your academic automation workflows with tests, a GitHub Actions run, and a Docker image.', deliver: 'Repo with green CI badge and one-command run.' },
    { id: 'rest-react', title: 'REST API + React dashboard for lab data', tracks: ['web'], skills: ['Node.js', 'Express', 'MongoDB', 'React', 'REST APIs', 'JavaScript'], weeks: 4, builds: 'BakeVerse', pitch: 'Build a small authenticated API and React front end for logging and plotting lab measurements.', deliver: 'Deployed app, API docs and a short demo video.' },
    { id: 'quantum', title: 'Quantum circuit playground', tracks: ['sci'], skills: ['Quantum Computing', 'Python', 'NumPy', 'Computational Physics'], weeks: 3, builds: 'Numerical, Statistical & Quantum Physics projects', pitch: 'Simulate small quantum circuits and reproduce textbook results such as Bell-state statistics.', deliver: 'Notebook with circuits, measurement histograms and explanations.' },
    { id: 'repro', title: 'Reproduce a published result', tracks: ['sci', 'ai-ml'], skills: ['Python', 'NumPy', 'Research & Writing', 'LaTeX', 'Git', 'Matplotlib'], weeks: 4, builds: 'Research project (Jadavpur University)', pitch: 'Pick a paper in your research area, reproduce one figure from its data or equations, and document the differences.', deliver: 'Repo, LaTeX note and a comparison figure.' },
    { id: 'kaggle', title: 'Tabular ML competition write-up', tracks: ['ai-ml', 'data'], skills: ['Python', 'Scikit-learn', 'Pandas', 'Statistics', 'Machine Learning'], weeks: 3, builds: 'new', pitch: 'Enter a beginner tabular competition, track experiments and write up what worked and what did not.', deliver: 'Public notebook and a blog-style write-up with scores.' },
    { id: 'nlp-lit', title: 'Literature search and summary tool', tracks: ['ai-ml'], skills: ['NLP', 'LLMs & GenAI', 'Python', 'Streamlit'], weeks: 3, builds: 'Research project (Jadavpur University)', pitch: 'Index open-access materials-science abstracts and build a searchable summariser with cited sources.', deliver: 'Deployed app with evaluation on 20 hand-checked queries.' },
    { id: 'model-api', title: 'Deploy a model as an API', tracks: ['ai-ml', 'web'], skills: ['FastAPI', 'Docker', 'Machine Learning', 'Python', 'Testing'], weeks: 2, builds: 'any trained model', pitch: 'Wrap one of your models in FastAPI, containerise it and add tests.', deliver: 'Dockerised service and a README with request examples.' },
    { id: 'vision', title: 'Micrograph image classifier', tracks: ['ai-ml', 'sci'], skills: ['Computer Vision', 'PyTorch', 'Deep Learning', 'Python'], weeks: 4, builds: 'Triboelectric/MOF research interest', pitch: 'Classify microscopy images from an open dataset with transfer learning and report per-class metrics.', deliver: 'Training notebook, confusion matrix and limitations section.' },
    { id: 'proof-sprint', title: 'Portfolio proof sprint', tracks: ['ai-ml', 'data', 'sci', 'web'], skills: ['Git', 'Communication'], weeks: 1, builds: 'this portfolio', pitch: 'Add a live demo or screenshot, a measurable result and a case study to each featured project. This is the fastest way to raise your evaluator score.', deliver: 'Every project card has a repo, a demo/screenshot and one verified number.' }
  ];
  const searchUrls = (q, loc) => ({
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}&f_JT=I`,
    indeed: `https://in.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(loc)}`
  });
  async function recommend(trackChoice, gapNames) {
    const base = await getBaseline();
    const fit = (name) => { const s = strengthOf(base, name); return s === 2 ? 1 : s === 1 ? 0.6 : 0; };
    const trackScores = Object.entries(TRACKS).map(([id, t]) => {
      const tot = Object.values(t.core).reduce((a, b) => a + b, 0);
      const have = Object.entries(t.core).reduce((a, [n, w]) => a + w * fit(n), 0);
      const strengths = Object.keys(t.core).filter((n) => fit(n) > 0), gaps = Object.entries(t.core).filter(([n]) => !fit(n)).sort((a, b) => b[1] - a[1]).map(([n]) => n);
      return { id, label: t.label, score: Math.round(100 * have / tot), strengths, gaps };
    }).sort((a, b) => b.score - a.score);
    const chosen = trackChoice === 'auto' ? trackScores.slice(0, 2).map((t) => t.id) : [trackChoice];
    const gapSet = new Set(gapNames || []);
    const projects = PROJECTS.map((p) => {
      const known = p.skills.filter((s) => fit(s) > 0), learn = p.skills.filter((s) => !fit(s));
      const skillFit = p.skills.reduce((a, s) => a + fit(s), 0) / p.skills.length;
      const relevance = p.tracks.some((t) => chosen.includes(t)) ? 1 : 0.25;
      const growth = learn.length >= 1 && learn.length <= 3 ? 1 : learn.length === 0 ? 0.5 : 0.4;
      const gapBonus = Math.min(15, learn.filter((s) => gapSet.has(s)).length * 7);
      return { ...p, known, learn, score: Math.round(clamp(100 * (0.4 * skillFit + 0.4 * relevance + 0.2 * growth) + gapBonus, 0, 100)), closes: learn.filter((s) => gapSet.has(s)) };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
    const loc = (CFG.owner && CFG.owner.location) || 'India';
    const roles = chosen.flatMap((id) => TRACKS[id].roles.map(([title, q]) => ({ title, q, track: TRACKS[id].label, urls: searchUrls(q, loc), trackId: id })));
    return { trackScores, chosen, projects, roles, base };
  }

  /* ---------- UI ---------- */
  const ring = (value, label) => {
    const r = 42, c = 2 * Math.PI * r, off = c * (1 - clamp(value, 0, 100) / 100);
    const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('class', 'cl-ring'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `${label}: ${value} out of 100`);
    const mk = (cls, extra = {}) => { const e = document.createElementNS(ns, 'circle'); e.setAttribute('cx', 50); e.setAttribute('cy', 50); e.setAttribute('r', r); e.setAttribute('class', cls); Object.entries(extra).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
    const val = mk('cl-ring-val', { 'stroke-dasharray': c.toFixed(1), 'stroke-dashoffset': off.toFixed(1), transform: 'rotate(-90 50 50)' });
    const t = document.createElementNS(ns, 'text'); t.setAttribute('x', 50); t.setAttribute('y', 56); t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'cl-ring-text'); t.textContent = value;
    svg.append(mk('cl-ring-bg'), val, t); return svg;
  };
  const bar = (pct, cls = '') => h('span', { class: `cl-bar ${cls}`, 'aria-hidden': 'true' }, h('i', { style: `width:${clamp(pct, 0, 100)}%` }));
  const chip = (text, cls = '') => h('span', { class: `cl-chip ${cls}`, text });
  const chips = (list, cls) => h('div', { class: 'cl-chips' }, list.length ? list.map((x) => chip(x, cls)) : h('span', { class: 'cl-muted', text: 'None' }));

  const state = { evalResult: null, compare: null, target: null, track: 'auto' };

  function renderBaseline(base) {
    const el = $('#cl-baseline');
    const n = [...base.skills.values()].filter((s) => s.strength === 2).length, l = base.skills.size - n;
    el.replaceChildren(
      h('strong', { text: 'Your skills baseline: ' }),
      `${n} evidenced, ${l} listed-only. Source: ${base.source === 'live' ? 'resume.pdf (read live)' : 'built-in snapshot of resume.pdf'} + website content` + (hasImports() ? ` + ${allCerts().length} imported credential(s)${imports.linkedin.skills.length ? `, ${imports.linkedin.skills.length} LinkedIn skill(s)` : ''}.` : '.')
    );
  }

  function renderEvaluation(r) {
    const out = $('#cl-eval-out');
    const top = h('div', { class: 'cl-score-head' },
      ring(r.score, 'Portfolio score'),
      h('div', null,
        h('h3', { text: `${r.band}: ${r.score}/100` }),
        h('p', { class: 'cl-muted', text: `Weighted rubric ${r.weighted}/100 minus ${r.ded} point(s) of deductions (capped at 15). Every score is computed from this page's real content; click a category to see the evidence.` }),
        h('p', { class: 'cl-muted', text: 'This is a heuristic checklist, not a prediction of hiring outcomes.' })));
    const cats = h('div', { class: 'cl-cats' }, r.crit.map((c) => {
      const pct = c.weight ? 100 * c.earned / c.weight : 0;
      return h('details', { class: 'cl-cat' },
        h('summary', null, h('span', { class: 'cl-cat-name', text: c.name }), bar(pct, pct < 50 ? 'is-low' : pct < 80 ? 'is-mid' : 'is-high'), h('span', { class: 'cl-cat-score', text: `${round1(c.earned)} / ${c.weight}` })),
        h('ul', { class: 'cl-checks' }, c.checks.map((k) => {
          const state = k.max === 0 ? 'skip' : k.score >= k.max - 0.01 ? 'pass' : k.score > 0 ? 'part' : 'fail';
          return h('li', { class: `cl-check is-${state}` },
            h('span', { class: 'cl-mark', 'aria-label': { pass: 'Passed', part: 'Partly met', fail: 'Not met', skip: 'Not checked' }[state], text: { pass: '✓', part: '◐', fail: '✗', skip: '–' }[state] }),
            h('div', null, h('strong', { text: k.label }), h('p', { text: k.evidence }), state !== 'pass' && state !== 'skip' ? h('p', { class: 'cl-fix', text: `Fix: ${k.fix}` }) : null));
        })));
    }));
    const ded = r.deductions.length
      ? h('div', { class: 'cl-block' }, h('h3', { text: 'Deductions' }), h('ul', { class: 'cl-checks' }, r.deductions.map((d) => h('li', { class: 'cl-check is-fail' }, h('span', { class: 'cl-mark', text: `−${d.points}` }), h('div', null, h('strong', { text: d.label }), h('p', { text: d.evidence }), h('p', { class: 'cl-fix', text: `Fix: ${d.fix}` }))))))
      : h('div', { class: 'cl-block' }, h('h3', { text: 'Deductions' }), h('p', { class: 'cl-muted', text: 'None found.' }));
    const acts = h('div', { class: 'cl-block' }, h('h3', { text: 'Highest-impact actions' }), h('ol', { class: 'cl-actions' }, r.actions.map((a) => h('li', null, h('strong', { text: a.title }), h('span', { class: 'cl-gain', text: `+${round1(a.gain)} pts` }), h('p', { text: a.fix })))));
    const copy = h('button', { type: 'button', class: 'cl-btn cl-btn-ghost', onclick: async (e) => {
      const md = [`# Portfolio evaluation: ${r.score}/100 (${r.band})`, '', ...r.crit.map((c) => `- ${c.name}: ${round1(c.earned)}/${c.weight}`), '', '## Actions', ...r.actions.map((a, i) => `${i + 1}. ${a.title} (+${round1(a.gain)}): ${a.fix}`)].join('\n');
      try { await navigator.clipboard.writeText(md); e.target.textContent = 'Copied'; } catch (_) { e.target.textContent = 'Copy blocked by browser'; }
    } }, 'Copy report as Markdown');
    out.replaceChildren(top, acts, cats, ded, h('div', { class: 'cl-row' }, copy));
  }

  async function runEvaluation() {
    const btn = $('#cl-eval-run'), out = $('#cl-eval-out');
    btn.disabled = true; out.replaceChildren(h('p', { class: 'cl-muted', text: 'Evaluating…' }));
    try { state.evalResult = await evaluatePortfolio(); renderBaseline(state.evalResult.base); renderEvaluation(state.evalResult); }
    catch (e) { out.replaceChildren(h('p', { class: 'cl-error', role: 'alert', text: `Evaluation failed: ${e.message}` })); }
    btn.disabled = false;
  }


  /* ---- tailored résumé: assembled only from text already on this site; nothing is invented ---- */
  function printResume(r) {
    const CFG = window.CAREER_LAB_CONFIG || {}, own = CFG.owner || {};
    const t = (el) => (el && el.textContent || '').replace(/\s+/g, ' ').trim();
    const target = new Set(r.rows.map((x) => x.name)), hit = (text) => { let n = 0; extractSkills(text).forEach((_, k) => { if (target.has(k)) n++; }); return n; };
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const sec = (title) => { const s = el('section', 'rs-sec'); s.append(el('h2', null, title)); return s; };
    const page = el('div'); page.id = 'cl-resume-print'; page.setAttribute('aria-hidden', 'true');
    const head = el('header', 'rs-head'); head.append(el('h1', null, own.name || 'Snehankur Mondal'));
    const contact = [own.linkedinUrl && own.linkedinUrl.replace(/^https?:\/\//, ''), own.githubUser && `github.com/${own.githubUser}`, location.href.split('#')[0].replace(/^https?:\/\//, '').replace(/index\.html$/, '')].filter(Boolean);
    head.append(el('p', 'rs-contact', contact.join('  ·  '))); if (r.label) head.append(el('p', 'rs-tag', `Tailored for: ${r.label}`)); page.append(head);
    const about = document.querySelector('#about .description p'); if (about) { const s = sec('Summary'); s.append(el('p', null, t(about))); page.append(s); }
    const sk = sec('Skills'); document.querySelectorAll('.skillcard').forEach((c) => {
      const names = [...c.querySelectorAll('.skilltags span')].map(t).sort((a, b) => hit(b) - hit(a));
      const p = el('p'); p.append(el('b', null, t(c.querySelector('h3')) + ': ')); names.forEach((n, i) => { const w = hit(n) ? el('b', 'rs-hit', n) : document.createTextNode(n); p.append(w, i < names.length - 1 ? ', ' : ''); }); sk.append(p); }); page.append(sk);
    const pr = sec('Projects'); { const cw = document.querySelector('#current-work'); if (cw) { const d = el('div', 'rs-item'); d.append(el('h3', null, 'Materials Discovery Using Machine Learning (ongoing)'), el('p', null, t(cw.querySelector('.cw-lead'))), el('p', 'rs-tech', 'Technologies: ' + [...cw.querySelectorAll('.cw-tech span')].map(t).join(', '))); pr.append(d); } }
    [...document.querySelectorAll('.project-card')].map((c) => ({ c, s: hit(t(c)) })).sort((a, b) => b.s - a.s).forEach(({ c }) => {
      const d = el('div', 'rs-item'); d.append(el('h3', null, t(c.querySelector('h3'))), el('p', null, t(c.querySelector('.project-body p'))), el('p', 'rs-tech', 'Technologies: ' + [...c.querySelectorAll('.tech-tags span')].map(t).join(', '))); pr.append(d); }); page.append(pr);
    const ex = sec('Experience'); document.querySelectorAll('.expercard').forEach((c) => { const d = el('div', 'rs-item'); d.append(el('h3', null, `${t(c.querySelector('h3'))} ${t(c.querySelector('.experience-date')) ? '· ' + t(c.querySelector('.experience-date')) : ''}`), el('p', 'rs-tech', t(c.querySelector('.expmeta')))); const ul = el('ul'); c.querySelectorAll('li').forEach((li) => ul.append(el('li', null, t(li)))); d.append(ul); ex.append(d); }); page.append(ex);
    const ed = sec('Education'); document.querySelectorAll('.timeline-content').forEach((c) => { const d = el('div', 'rs-item'); d.append(el('h3', null, t(c.querySelector('h3'))), el('p', 'rs-tech', t(c.querySelector('.education-meta')))); ed.append(d); }); page.append(ed);
    const cr = sec('Certifications'); [...document.querySelectorAll('#credentials .cred-item')].map((c) => ({ c, s: hit(t(c)) })).sort((a, b) => b.s - a.s).slice(0, 8).forEach(({ c }) => cr.append(el('p', null, `${t(c.querySelector('h4'))} — ${t(c.querySelector('.cred-issuer'))}`))); page.append(cr);
    document.getElementById('cl-resume-print')?.remove(); document.body.append(page); document.body.classList.add('cl-printing');
    const done = () => { document.body.classList.remove('cl-printing'); page.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done); setTimeout(() => window.print(), 50);
  }

  function renderCompare(r) {
    const out = $('#cl-cv-out'), cv = r.mode === 'cv';
    const listRow = (rows, cls, extra) => h('div', { class: 'cl-chips' }, rows.length ? rows.map((x) => chip(x.name + (extra ? extra(x) : ''), cls)) : h('span', { class: 'cl-muted', text: 'None' }));
    const head = h('div', { class: 'cl-score-head' }, ring(r.score, 'Match'), h('div', null,
      h('h3', { text: `${r.score}% match${r.label ? ' with ' + r.label : ''}` }),
      h('p', { class: 'cl-muted', text: `${r.rows.length} skills detected in the uploaded ${cv ? 'CV' : 'document'}. Demonstrated skills count in full, listed-only skills at 60%, closely related skills at 25%, and importance is weighted by how often and where a skill is mentioned (requirements count more than "nice to have").` })));
    const sections = [
      h('div', { class: 'cl-block' }, h('h3', { text: cv ? 'In both CVs, backed by evidence' : 'Strong matches' }), listRow(r.strong, 'is-good')),
      h('div', { class: 'cl-block' }, h('h3', { text: 'Listed but not yet proven' }), listRow(r.listed, 'is-warn')),
      h('div', { class: 'cl-block' }, h('h3', { text: cv ? 'In the uploaded CV, missing from yours' : 'Skill gaps' }), listRow(r.missing, 'is-bad', (x) => (x.adjacent ? ` (related: ${x.adjacent[0]})` : ''))),
      r.extras.length ? h('div', { class: 'cl-block' }, h('h3', { text: cv ? 'Only in your CV' : 'Strengths not asked for' }), chips(r.extras)) : null
    ];
    const notes = r.notes.map((n) => h('p', { class: 'cl-note', text: n }));
    const sug = h('div', { class: 'cl-block' }, h('h3', { text: 'Improvement suggestions' }), h('ul', { class: 'cl-suggest' }, r.suggestions.map((s) => h('li', null, chip(s.kind, 'is-kind'), ' ', s.text))), h('p', { class: 'cl-muted', text: 'Only add skills you can discuss and demonstrate.' }));
    const go = h('button', { type: 'button', class: 'cl-btn', onclick: () => { activateTab('rec'); } }, 'Get project and internship recommendations for these gaps →');
    const pdf = h('button', { type: 'button', class: 'cl-btn', onclick: () => printResume(r) }, 'Download tailored résumé (PDF)');
    const pnote = h('p', { class: 'cl-muted', text: 'Built only from what is already on this site: skills and projects matching the target come first and are bolded. Nothing is invented. In the print dialog choose "Save as PDF".' });
    out.replaceChildren(head, ...notes, ...sections, sug, h('div', { class: 'cl-btnrow' }, pdf, go), pnote);
  }

  async function runCompare() {
    const out = $('#cl-cv-out'), status = $('#cl-cv-status'), file = $('#cl-cv-file').files[0], pasted = $('#cl-cv-paste').value.trim();
    const mode = $('input[name="cl-cv-mode"]:checked').value, label = clean($('#cl-cv-label').value, 80);
    const btn = $('#cl-cv-run'); btn.disabled = true; out.replaceChildren(); say(status, '');
    try {
      let text = '';
      if (file) {
        if (file.size > 10 * 1024 * 1024) throw new Error('That file is over 10 MB.');
        say(status, 'Reading PDF in your browser…');
        text = /\.txt$/i.test(file.name) || file.type === 'text/plain' ? normalizeText(await file.text()) : await pdfToText(await file.arrayBuffer());
      } else if (pasted) text = normalizeText(pasted);
      else throw new Error('Choose a PDF, or paste text below.');
      if (words(text) < 40) throw new Error('Very little text could be read. If the PDF is a scan or image, paste its text into the box instead.');
      say(status, 'Comparing…');
      state.compare = await compareToTarget(text, mode, label);
      renderBaseline(state.compare.base); renderCompare(state.compare); say(status, `Done. Read ${words(text)} words.`);
    } catch (e) { say(status, ''); out.replaceChildren(h('p', { class: 'cl-error', role: 'alert', text: e.message })); }
    btn.disabled = false;
  }

  function renderRec(r) {
    const out = $('#cl-rec-out');
    const tracks = h('div', { class: 'cl-block' }, h('h3', { text: 'Direction fit from your skills' }), h('div', { class: 'cl-tracks' }, r.trackScores.map((t) => h('div', { class: `cl-track${r.chosen.includes(t.id) ? ' is-chosen' : ''}` }, h('strong', { text: t.label }), bar(t.score), h('span', { class: 'cl-muted', text: `${t.score}% of core skills` }), h('p', { class: 'cl-muted', text: `Have: ${t.strengths.slice(0, 5).join(', ') || 'none yet'}. Next: ${t.gaps.slice(0, 3).join(', ') || 'none'}.` })))));
    const proj = h('div', { class: 'cl-block' }, h('h3', { text: 'Projects to build next' }), h('div', { class: 'cl-cards' }, r.projects.map((p) => h('article', { class: 'cl-card' },
      h('div', { class: 'cl-card-top' }, h('strong', { text: p.title }), h('span', { class: 'cl-gain', text: `${p.score}% fit` })),
      h('p', { text: p.pitch }),
      h('p', { class: 'cl-muted', text: `Deliverable: ${p.deliver}` }),
      h('p', { class: 'cl-muted', text: `About ${p.weeks} week${p.weeks > 1 ? 's' : ''}${p.builds && p.builds !== 'new' ? ` · builds on: ${p.builds}` : ''}` }),
      h('div', { class: 'cl-chips' }, p.known.map((s) => chip(s, 'is-good')), p.learn.map((s) => chip(`+ ${s}`, p.closes.includes(s) ? 'is-bad' : 'is-warn'))),
      p.closes.length ? h('p', { class: 'cl-note', text: `Closes gap(s) from your CV comparison: ${p.closes.join(', ')}.` }) : null))));
    const loc = (CFG.owner && CFG.owner.location) || 'India';
    const roles = h('div', { class: 'cl-block' }, h('h3', { text: 'Internship paths to search' }), h('div', { class: 'cl-cards' }, r.roles.map((x) => h('article', { class: 'cl-card' },
      h('strong', { text: x.title }), h('p', { class: 'cl-muted', text: x.track }),
      h('div', { class: 'cl-links' }, h('a', { href: x.urls.linkedin, target: '_blank', rel: 'noopener noreferrer', text: 'LinkedIn search ↗' }), h('a', { href: x.urls.indeed, target: '_blank', rel: 'noopener noreferrer', text: 'Indeed search ↗' }))))),
      h('p', { class: 'cl-muted', text: `These open live searches (location: ${loc}); this tool does not list or guarantee specific vacancies. Also look for university and national-academy summer research fellowships and lab visiting-student programmes, and check each programme's own page for eligibility and dates.` }));
    out.replaceChildren(tracks, proj, roles);
  }
  async function runRec() {
    const out = $('#cl-rec-out'); out.replaceChildren(h('p', { class: 'cl-muted', text: 'Matching…' }));
    try {
      const gaps = state.compare ? state.compare.missing.map((m) => m.name) : [];
      const r = await recommend(state.track, gaps); renderBaseline(r.base); renderRec(r);
      $('#cl-rec-ctx').textContent = gaps.length ? `Including ${gaps.length} gap(s) from your last CV comparison.` : 'Run a CV comparison first to add target-role gaps to these recommendations.';
    } catch (e) { out.replaceChildren(h('p', { class: 'cl-error', role: 'alert', text: e.message })); }
  }

  /* ---- Connect profiles ---- */
  function renderImports() {
    const box = $('#cl-import-summary');
    const certs = allCerts();
    box.replaceChildren(
      h('p', null, h('strong', { text: 'Imported so far: ' }), `${imports.linkedin.skills.length} LinkedIn skill(s), ${imports.linkedin.positions.length} position(s), ${imports.linkedin.certs.length} LinkedIn and ${imports.coursera.certs.length} Coursera credential(s).`),
      certs.length ? h('ul', { class: 'cl-cert-list' }, certs.slice(0, 40).map((c) => {
        const li = h('li', null, h('strong', { text: c.name }), ` ${[c.issuer, c.date].filter(Boolean).join(' · ')} `, chip(c.source === 'coursera' ? 'Coursera' : 'LinkedIn', 'is-kind'));
        if (c.url) li.append(' ', h('a', { href: c.url, target: '_blank', rel: 'noopener noreferrer', text: 'Open verification link ↗' }));
        else li.append(' ', chip('no link: unverified', 'is-warn'));
        return li;
      })) : null,
      hasImports() ? h('button', { type: 'button', class: 'cl-btn cl-btn-ghost', onclick: () => { imports = emptyImports(); saveImports(); resetBaseline(); renderImports(); getBaseline().then(renderBaseline); } }, 'Clear imported data') : null);
  }
  const mergeUnique = (a, b, key) => { const seen = new Set(a.map(key)); return [...a, ...b.filter((x) => !seen.has(key(x)))]; };
  async function importLinkedInFiles(files) {
    const status = $('#cl-li-status'); const added = { skills: 0, certs: 0, positions: 0 }; const skipped = [];
    for (const f of files) {
      try {
        if (f.size > 5 * 1024 * 1024) { skipped.push(f.name); continue; }
        const parsed = classifyCsv(parseCsv(await f.text()));
        if (!parsed) { skipped.push(f.name); continue; }
        const incoming = sanitizeImports({ linkedin: { [parsed.type]: parsed.items.map((x) => (parsed.type === 'skills' ? x : { ...x, source: 'linkedin' })) } }).linkedin;
        if (parsed.type === 'skills') { const before = imports.linkedin.skills.length; imports.linkedin.skills = [...new Set([...imports.linkedin.skills, ...incoming.skills])]; added.skills += imports.linkedin.skills.length - before; }
        if (parsed.type === 'certs') { const before = imports.linkedin.certs.length; imports.linkedin.certs = mergeUnique(imports.linkedin.certs, incoming.certs, (c) => c.name.toLowerCase()); added.certs += imports.linkedin.certs.length - before; }
        if (parsed.type === 'positions') { const before = imports.linkedin.positions.length; imports.linkedin.positions = mergeUnique(imports.linkedin.positions, incoming.positions, (p) => `${p.title}|${p.company}`.toLowerCase()); added.positions += imports.linkedin.positions.length - before; }
      } catch (_) { skipped.push(f.name); }
    }
    imports.linkedin.via = 'export'; saveImports(); resetBaseline(); renderImports();
    say(status, `Added ${added.skills} skill(s), ${added.certs} certification(s), ${added.positions} position(s).${skipped.length ? ` Not recognised: ${skipped.join(', ')}. Expected Skills.csv, Certifications.csv or Positions.csv.` : ''}`);
    getBaseline().then(renderBaseline);
  }
  function importCoursera() {
    const status = $('#cl-co-status'), text = $('#cl-co-text').value;
    const items = parseCourseraLines(text);
    if (!items.length) { say(status, 'Nothing usable found. Use one credential per line, with a coursera.org link if you have it. Links to other sites are ignored here.'); return; }
    const before = imports.coursera.certs.length;
    imports.coursera.certs = mergeUnique(imports.coursera.certs, sanitizeCerts(items).map((c) => ({ ...c, issuer: 'Coursera', source: 'coursera' })), (c) => (c.url || c.name).toLowerCase());
    imports.coursera.via = 'manual'; saveImports(); resetBaseline(); renderImports();
    const linked = items.filter((i) => i.url).length;
    say(status, `Added ${imports.coursera.certs.length - before} credential(s); ${linked} with a recognised Coursera link format. A link's format is checked here, but not whether the credential is genuine. Open each link to verify it.`);
    getBaseline().then(renderBaseline);
  }
  async function syncProvider(name) {
    const conf = (CFG.integrations || {})[name], status = $(`#cl-${name === 'linkedin' ? 'li' : 'co'}-sync-status`);
    if (!conf || !conf.enabled || !conf.endpoint) { say(status, 'Not configured. Add a backend endpoint in career-config.js (see the comments there) to switch this on.'); return; }
    try {
      const url = safeHttps(conf.endpoint); if (!url) throw new Error('Endpoint must be https.');
      const res = await fetch(url.href, { credentials: 'include', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Endpoint returned ${res.status}.`);
      const data = await res.json();
      const clean2 = sanitizeImports({ linkedin: { skills: data.skills, certs: data.certifications, positions: data.positions }, coursera: { certs: data.certifications } });
      if (name === 'linkedin') { imports.linkedin = { ...clean2.linkedin, via: 'api', certs: mergeUnique(imports.linkedin.certs, clean2.linkedin.certs, (c) => c.name.toLowerCase()), skills: [...new Set([...imports.linkedin.skills, ...clean2.linkedin.skills])] }; }
      else imports.coursera = { certs: mergeUnique(imports.coursera.certs, clean2.coursera.certs, (c) => (c.url || c.name).toLowerCase()), via: 'api' };
      saveImports(); resetBaseline(); renderImports(); say(status, 'Synced.'); getBaseline().then(renderBaseline);
    } catch (e) { say(status, `Sync failed: ${e.message} Use the manual import below.`); }
  }
  function renderIntegrationState() {
    ['linkedin', 'coursera'].forEach((n) => {
      const conf = (CFG.integrations || {})[n] || {}, on = conf.enabled && conf.endpoint;
      const badge = $(`#cl-${n === 'linkedin' ? 'li' : 'co'}-badge`);
      badge.textContent = on ? 'Official sync: configured' : 'Official sync: not configured';
      badge.className = `cl-chip ${on ? 'is-good' : 'is-warn'}`;
      const btn = $(`#cl-${n === 'linkedin' ? 'li' : 'co'}-sync`); btn.disabled = !on;
    });
  }

  /* ---- tabs ---- */
  const tabs = $$('.cl-tab'), panels = $$('.cl-panel');
  const ran = {};
  function activateTab(id, focus = false) {
    tabs.forEach((t) => { const on = t.dataset.tab === id; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    panels.forEach((p) => { p.hidden = p.id !== `cl-panel-${id}`; });
    if (id === 'eval' && !ran.eval) { ran.eval = true; runEvaluation(); }
    if (id === 'rec') runRec();
    if (id === 'connect') renderImports();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activateTab(t.dataset.tab));
    t.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); activateTab(tabs[(i + k + tabs.length) % tabs.length].dataset.tab, true); }
      if (e.key === 'Home') { e.preventDefault(); activateTab(tabs[0].dataset.tab, true); }
      if (e.key === 'End') { e.preventDefault(); activateTab(tabs[tabs.length - 1].dataset.tab, true); }
    });
  });
  $('#cl-eval-run').addEventListener('click', () => { resetBaseline(); runEvaluation(); });
  $('#cl-cv-run').addEventListener('click', runCompare);
  $('#cl-cv-file').addEventListener('change', (e) => { const f = e.target.files[0]; say($('#cl-cv-filename'), f ? `${f.name} (${Math.round(f.size / 1024)} KB)` : 'No file chosen'); });
  $('#cl-track').addEventListener('change', (e) => { state.track = e.target.value; runRec(); });
  $('#cl-li-files').addEventListener('change', (e) => { importLinkedInFiles(Array.from(e.target.files)); e.target.value = ''; });
  $('#cl-co-add').addEventListener('click', importCoursera);
  $('#cl-li-sync').addEventListener('click', () => syncProvider('linkedin'));
  $('#cl-co-sync').addEventListener('click', () => syncProvider('coursera'));
  renderIntegrationState();
  renderImports();
  getBaseline().then(renderBaseline).catch(() => say($('#cl-baseline'), 'Could not load the CV baseline.'));

  // Lazy-run the evaluator when the section first scrolls into view.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { io.disconnect(); activateTab('eval'); } }, { rootMargin: '200px' });
    io.observe(root);
  } else activateTab('eval');

  // Test hook (also useful from the console).
  window.CareerLab = { taxonomy: T.map((r) => ({ name: r.name, category: r.cat, weight: r.weight })), printResume, extractSkills, evaluatePortfolio, compareToTarget, recommend, parseCsv, classifyCsv, parseCourseraLines, pdfToText, getBaseline };
})();
