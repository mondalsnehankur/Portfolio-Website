/*
 * Career Lab configuration. Edit this file; no build step needed.
 *
 * INTEGRATIONS
 * A static site cannot safely complete OAuth for LinkedIn or Coursera (the token exchange needs a
 * client secret). So both are OFF by default and the Career Lab uses official manual routes
 * (LinkedIn data export, Coursera verification links). To switch one on, deploy a tiny backend/serverless
 * function that holds the secret and returns JSON in the shapes documented below, then set `endpoint`.
 *
 *   endpoint contract (GET, same-site or CORS-enabled, returns 200 JSON):
 *     { "skills": ["Python", ...],
 *       "certifications": [{ "name": "...", "issuer": "...", "date": "YYYY-MM", "url": "https://..." }],
 *       "positions": [{ "title": "...", "company": "..." }] }
 *
 * Access to these data sets is controlled by the providers, not by this site. Check the current developer
 * documentation for LinkedIn (Sign In with LinkedIn / Member Data Portability) and Coursera before relying
 * on either.
 */
window.CAREER_LAB_CONFIG = {
  owner: { name: 'Snehankur Mondal', linkedinUrl: 'https://www.linkedin.com/in/snehankur-mondal/', githubUser: 'mondalsnehankur' },
  cvUrl: 'resume.pdf',
  // Extra site pages the evaluator should audit for empty/placeholder content (served over http/https only).
  pagesToCheck: ['more-projects.html', 'stochastic-quantum.html', 'numerical-methods.html'],
  pdfJs: {
    script: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    worker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  },
  integrations: {
    linkedin: { enabled: false, endpoint: '' },
    coursera: { enabled: false, endpoint: '' }
  },
  // Used when resume.pdf cannot be fetched (for example when index.html is opened from disk).
  // Regenerate it after you update resume.pdf, or leave it: the live PDF is preferred whenever it loads.
  cvSnapshot: "SNEHANKUR MONDAL\nsnehankur.mondal02@gmail.com\nsnehankur-mondal\nmondalsnehankur\nComputer science postgraduate with a Physics background and hands-on experience\nSummary\nin Python development, scientiﬁc computing, data analysis, and web application development.\nExperienced in building technical projects that combine analytical problem-solving with\npractical software solutions, with a growing focus on AI/ML and data-driven applications.\nBrings an interdisciplinary perspective, research experience, and leadership development\nexposure through Christ University’s Future Leaders Programme for Christites (FLPC).\nEducation\nMaster of Computer Applications (MCA) Christ University, Delhi NCR | 2026‒Present\nMaster of Science (M.Sc.) ‒ Physics University of Calcutta (2024 ‒ 2026)\nBachelor of Science (B.Sc. Hons) ‒ Physics\nUniversity of Calcutta (2021 ‒ 2024)\n\nTechnical Skills\nCGPA: 7.695 | Core CGPA: 7.9\n•\nCollege Rank: 2nd\nProgramming: Python, C/C++, Java, R.\nWeb Technologies: HTML, CSS, JavaScript, React, Node.\nLibraries: NumPy, SciPy, Matplotlib, tKinter, PyTorch, Pandas, Scikit-Learn, Seaborn,\nTensorFlow.\nTools & Platforms: MATLAB, VS Code, Linux, LaTeX, Excel, MySQL, Tableau, Origin.\nDomains: Computational Physics, Numerical Methods, Data Analysis, AI/ML, Web\nDevelopment\nProjects\nPhysics Simulator (C): Developed a C-based physics simulator using functions and numerical\nformulas to calculate harmonic oscillations, gravity, escape velocity, and orbital parameters.\nAI/ML Materials Prediction: Research Project: Developing an AI/ML system that predicts\nsuitable material combinations and proportions from desired properties to simplify material\nselection and testing.\nBakeVerse: AI-Integrated Web Project: Developed a bakery-focused web application using\nHTML, CSS, JavaScript, and AI/ML features to provide an interactive online experience.\nNumerical, Statistical & Quantum Physics Projects: Applied numerical, statistical, and\nquantum-mechanical methods to solve and analyse computational physics problems.\nMarine Data Analysis Tool: Developed Python-based workﬂows for processing, analysing, and\nvisualising marine scientiﬁc datasets.\nPortfolio Website: Developed a responsive portfolio website using HTML, CSS, and\nJavaScript to showcase projects and technical skills.\nExperience\nResearch Project / Researcher: Materials Science & Energy Systems | Jadavpur University |\n2026‒Present\nAnalyzing experimental/material datasets using Python for processing, visualization, and\ncomputational interpretation.\nPython Developer: Academic Automation Project | Self-initiated | Dec 2025‒Present\nDeveloped Python workﬂows for academic and Marine Science Research Data processing,\nnumerical estimation, and scientiﬁc computation.\nWeb & Frontend Development Intern | Future Interns | Feb 2026‒Mar 2026\nBuilt responsive web interfaces using HTML, CSS, and JavaScript with clean, reusable UI\ncomponents.\nLeadership &\nLeadership & Development\nDevelopment\nFuture Leaders Programme for Christites (FLPC) | Christ University\n\nDepartment-nominated participant, selected to represent the department in a\nuniversity-wide leadership development programme.\n\nParticipated in a structured, one-day workshop featuring leadership-focused activities\ndesigned to develop collaboration, communication, and problem-solving skills.\nOrganized college fests and departmental events, managing coordination and execution.\nCertiﬁcations\nAchievements &\nAwards\nAdditional\n\nWeb Development Fundamentals - IBM\n\nArtiﬁcial Intelligence Fundamentals - IBM\n\nData Science (Microsoft Certiﬁed ‒ DP-900) - Microsoft\n\nFull Stack Web Development - Future Interns\n\nData Analytics Certiﬁcate ‒ Google\n\nMachine Learning Specialization ‒ DeepLearning.AI & Stanford Online (In Progress)\n\nBest Poster Award (Postgraduate Category) ‒ MOF-Enhanced PVDF for\nTriboelectric Energy Harvesting\n\n2nd Prize ‒ BARC National-Level Quiz\n\n3rd Prize ‒ Ramakrishna Mission Inter-College Quiz\n\nRepresented institution at academic science events\nLanguages: English, Bengali, Hindi\nInterests: Music, Guitar, Science Outreach, Hackathons(SIH)"
};
