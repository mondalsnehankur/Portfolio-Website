# Snehankur Mondal — Portfolio

A responsive personal portfolio built with HTML, CSS, and a small amount of JavaScript.

## Sections
- Introduction and professional summary
- About
- Three featured projects, including a BakeVerse chooser for its GitHub repository and live website
- Technical skills
- Experience and research
- Education
- Leadership and recognition
- Contact form and social links

## Run locally
1. Download or clone this repository.
2. Open `index.html` in a browser.
3. For local development, you may use the VS Code Live Server extension.

No build step is required.

## Before publishing
- Featured project links point to the supplied BakeVerse, Physics Simulator, and Marine Automation URLs. Confirm the repositories are public and the deployed website is accessible before sharing the portfolio.
- The included `resume.pdf` has been refreshed using the latest CV supplied in this conversation.
- Submit a test message through the contact form to confirm the configured Formspree endpoint is still active.
- Check the site on mobile and desktop after publishing.

## Deployment
This is a static website and can be hosted with GitHub Pages, Netlify, or any static web host.

## Interactive features (v8)
- **Project explorer:** filter the featured projects by web development, scientific software, or data analysis.
- **Interactive skills map:** select a technology to see how it relates to the portfolio's projects or skills section. Descriptions are intentionally limited to technologies already documented on this page.
- **Quick-jump command palette:** click `Quick jump` in the navigation or press `Ctrl+K` (`Cmd+K` on macOS) to search site sections and actions. Press `Esc` to close it. Quick keys outside text fields: `P` projects, `S` skills, `M` metrics, `F` FLPC/leadership, `G` GitHub, `C` contact, and `T` theme toggle.
- **Contact helpers:** jump to the existing contact form or copy the public GitHub profile link. No email address is guessed or hard-coded.
- **Project metrics dashboard:** summarizes the three featured projects, four skills categories, FLPC participation, and a public-repository count when the GitHub API is available.
- **GitHub snapshot:** fetches public profile/repository data from GitHub when online; graceful fallback links remain available if the API cannot be reached.
- **FLPC photo placeholders:** replace `pic1.jpg`, `pic2.jpg`, and `pic3.jpg` in the `flpcPhotos` array or add more objects to that array.

## Notes
- Project and skills filters, command palette, and copy helper are client-side; no server or build step is required.
- Live GitHub data requires an internet connection and may be subject to GitHub API rate limits.
- Keyboard shortcuts are suppressed while typing in input fields; visitors can also use the visible buttons and links.

## Career Lab (v9)
New `#career-lab` section; files: `career-lab.js`, `career-lab.css`, `career-config.js`.
- **Portfolio evaluator:** weighted rubric (8 areas, 100 pts) with per-check evidence, deductions (placeholder text, empty pages, unsupported claims, broken images; capped at 15) and ranked fixes.
- **CV comparison:** upload a job/internship PDF (or another CV) or paste text. Read in-browser with pdf.js (cdnjs, loaded on demand). Compares to `resume.pdf` + site content; skill gaps, unproven skills, suggestions.
- **Recommendations:** four career directions scored from your skills; project ideas and LinkedIn/Indeed internship searches (no fabricated vacancies).
- **LinkedIn & Coursera:** official sync is OFF until you deploy a backend (OAuth secrets cannot live in a static site) and set `integrations.*.endpoint` in `career-config.js`. Manual fallback: LinkedIn data-export CSVs, Coursera credential links (format check only).
- Update `cvSnapshot` in `career-config.js` when `resume.pdf` changes (used only when the PDF cannot be fetched, e.g. `file://`).
- Test over http (`python -m http.server`); PDF fetch and page audits need it.

## Navigation and theme (v9.1)
- Nav is now one compact row on desktop (primary links + a "More" menu, Resume, Quick jump, theme icon) and a hamburger menu under 1000px; `nav.js` handles the menu and highlights the current section.
- Light-theme fixes are in the last blocks of `style.css`.

## Live physics demo (WebAssembly)
`simulator.html` runs the C code from the Physics-Simulator repo in the browser. `wasm/src` holds the original `physics.c`, `planets.c`, `space.h` (unchanged) plus `wasm_api.c` and a small math shim. Rebuild with `wasm/build.sh` (needs clang with wasm32 and wasm-ld). `wasm/space-wasm.js` embeds the module so the page also works from disk.

## Ask about me (Career Lab → "Ask about me")
A search assistant over this page's own content and your CV. It is not an AI model, never invents facts, and each answer links to the section it came from. Add content to the page and it is picked up automatically.

## Tailored résumé export
After a CV/job comparison, "Download tailored résumé (PDF)" assembles a one-to-two page résumé from text already on the site. Skills and projects matching the target come first and are bolded. Choose "Save as PDF" in the print dialog.

## AI ebooks and Notes
Add another ebook by copying the commented `.ebook-item` template in the `#ebooks` section. Notes are placeholders in `#notes`; copy the commented `.note-item` template to publish.

## Analytics (privacy-friendly, off by default)
Create a free site at goatcounter.com, then put its code in `site-config.js` (`goatcounter: 'yourcode'`). Cookie-less, respects Do Not Track, also counts clicks on project/demo/verify links. Leave it empty to disable.

## Before deploying
- `index.html` and `simulator.html` use `https://mondalsnehankur.github.io/Portfolio-mY_wEBSITE/` as the canonical/Open Graph URL. Change it if hosted elsewhere.
- Test the contact form (Formspree) once after deploy.

## Visual layer
`visual.css` (loaded last) gives each section its own hue from a "light spectrum" palette, graph-paper backgrounds, unified serif headings, coloured card edges and a spectrum name in the hero. Change hues in the `--c-*` variables at the top, or remove the `<link>` to `visual.css` to revert.

## Pictures
- `img/projects/space-mission.webp`: real render from the live WebAssembly orbit demo (card links to `simulator.html`).
- `img/certs/`: images of the issued certificates, shown as thumbnails on the matching credential cards (click to enlarge).
- Drop-in screenshots: save a picture as `img/projects/bakeverse.png`, `ebook-software-process.png`, `ebook-computer-organisation.png` or `ebook-set-theory.png` (png, jpg or webp) and it appears automatically. Without a file, the built-in illustration stays. For a new ebook, add `<img class="ebook-shot" data-shot="img/projects/<name>">` to its card.

## Colour and data visuals
- "Tools I build with" strip under the hero uses logos in `img/tools/`. Edit the `<ul class="toolbelt-list">` in `index.html` to add or remove tools.
- The skills radar (Skills section) is generated by `viz.js` from this page plus your CV; it compares your own areas, not a rating against others. It updates when you add skills or projects.
- Tech tags get a coloured dot from the `COLORS` table at the top of `viz.js`.

## Professional details
- Availability pill in the hero ("Open to internships ...") mirrors the About section; edit or remove the `.hero-status` line in `index.html` when that changes.
- Status chips (Live, Live demo, Research in progress) on the project cards.
- 2026 learning timeline above the credential cards. Add a month by copying a `<li>` in `ol.year-timeline`.
- Reading-progress bar, back-to-top button (`viz.js`) and a structured footer with links.

Screenshots for BakeVerse and the three ebooks are now in `img/projects/` (cropped from your own captures). To replace one, overwrite the file with the same name.

## Current work highlight
`#current-work` (just under the tools strip) features "Materials discovery using machine learning". Update the `.cw-step` statuses (`is-done`, `is-wip`, `is-next`) as the project moves along. Career Lab, Ask and the tailored résumé all read this section.

Credential cards are intentionally compact (small corner thumbnails, four per row). Adjust the "compact credentials" block at the bottom of `visual.css` to resize them.

## Light theme
`light.css` (loaded last) holds the corporate light palette: cool white surfaces, navy text, cobalt accent, teal for live states, a navy terminal and footer. Edit the colour variables at the top of the file. Every section also shares one content width (set at the end of `visual.css`) so left edges line up in both themes.

## Publishing on GitHub Pages
Upload the whole folder structure, including `img/` (with `projects`, `certs` and `tools` inside). With git: `git add -A && git commit -m "Update portfolio" && git push`. On the GitHub website, drag the `img` folder itself into "Upload files"; picking files with the file dialog skips folders. File names are case-sensitive on GitHub. After pushing, wait a minute and hard-refresh (Ctrl+Shift+R).

## Latest round of changes

- **Tools strip** is a looping marquee (right to left). It pauses on hover/focus and becomes a static wrap if the visitor prefers reduced motion. Add a tool by adding another `<li>` to `.marquee-track`.
- **About picture** (`figure.about-figure`) is optional; delete that figure and the layout falls back to one column.
- **Marine Data Analysis Tool** is labelled *Private* / *Research in progress*, with a note that it is a novelty project feeding a research paper. It also shows as a private card in the GitHub section.
- **Ebooks and Notes** scroll horizontally (`data-hscroll`). Add more cards inside the row; arrows appear automatically when they overflow.
- **Hover previews** on Leadership cards: FLPC uses `img/recognition/flpc-1..5.webp`. For Best Poster, add `img/recognition/best-poster-1.jpg` (up to 4; webp/png/jpg/jpeg all work). Until the photos exist, the card shows no preview. Upload the whole `img/` folder including `img/recognition/`.
- **Credentials**: every card is the same fixed size, with long text clamped.
- **GitHub section** is drawn like a GitHub profile (profile on the left, repository cards on the right).

## Entry gate (owner vs visitor)

`gate.js` shows a faded copy of the site with a prompt on load.
- Type your name (`snehankur` or `snehankur mondal`) for the **owner** view: everything, including the Portfolio evaluator score and Recommendations.
- Type `open`, `code`, `hello` and similar words for the **visitor** view: the whole site, CV comparison and LinkedIn/Coursera import included, but without the evaluator score and recommendations.
- The choice lasts for the browser tab. The footer "Lock" button asks again.
- Change the owner word: in the browser console run the `hash` function from `gate.js` on the new lower-case word and replace the entries in `OWNER`. Edit `VISITOR` to change the visitor words.
- This is not real security. The site is static, so anyone reading the page source can find the hidden panels. It tidies what visitors see; it does not protect secrets.

## Added projects
Adaptigrade (Smart India Hackathon / DRDO, results awaited), Automated Data Analysis Software, SahaayOS (in progress) and the Local-First Travel Planner are in the Projects section. They use drawn illustrations; to use a real screenshot instead, copy the BakeVerse card's `<img class="shot" data-shot="img/projects/NAME">` pattern. Add live/source links by copying the `project-link` anchors from the Physics Simulator card.

## Skeuomorphic design (skeuo.css)
`skeuo.css` is the last stylesheet and adds the physical look: raised cards with a lit top edge, keys that press in, recessed input fields, keycap tool chips and a bezelled terminal screen. Dark theme uses dark soft-touch plastic; light theme uses frosted glass (blurred translucent cards over a soft colour field). Tune the look with the variables at the top of the file (`--sk-raise`, `--sk-key`, `--sk-glass`). To go back to the flat design, remove the `skeuo.css` link in `index.html`.

## Best Poster gallery
The Best Poster card now behaves like FLPC: hover previews the photos, click opens a gallery. Photos are `img/recognition/best-poster-1..4.webp`; captions and order are in the `photos` list in the "Best Poster gallery" block in `index.html`. Upload `img/recognition/` with the rest of the site.

## LeetCode card
Open `site-config.js`, fill in `leetcode.username` and your solved counts (easy / medium / hard), optional contest rating and "updated" month. Until a username is set, nothing is shown. If all counts are 0, the card shows only your profile link. A LeetCode link is also added to the footer. Update the numbers by hand every few weeks; there is no official LeetCode API, so nothing is fetched automatically.

## Scenery, education map, compact dashboard
- `scenery.css` has been deleted: the landscape background (`landscape.js`) replaced it. The education map and compact dashboard notes above still apply.
- Education is a left-to-right route map (B.Sc. to M.Sc. to MCA). On phones it stays a vertical list. Years come from the `data-year` attribute on each `.timerow`.
- The "small dashboard of work" tiles are about a third smaller.

## Infinite horizontal rows and the About ER diagram
- Horizontal rows (certifications, ebooks, notes, programs) now loop forever in both directions when they hold more cards than fit on screen. Rows whose cards all fit stay a plain static row, so you never see duplicate cards side by side; they start looping automatically once you add more cards. Arrow keys work when a row is focused.
- The About section has an inline SVG entity-relationship diagram (`figure.about-er`). Edit entity names or attributes directly in that SVG, or delete the figure to return to text only.


## Playful extras (optional)

Three small touches, none of which gate content:

1. **Orbit slingshot** (`#orbit-play`): drag the probe back and release. Gravity from the sun bends its path; landing on a moon (Projects, Skills, Research, Contact) scrolls to that section. Keyboard: focus the probe, arrow keys aim, Enter launches. "Skip the game" and plain links sit beside it.
2. **Reactive background**: the line art behind sections drifts slightly with the cursor (fine pointers only, off when reduced motion is requested).
3. **Hidden commands**: type anywhere outside a text box: `sudo` (opens the terminal), `matrix` or the Konami code (brief matrix rain), `orbit`, `hello`, `theme`.

To remove: delete the `play.css` link, the `play.js` script, the `#orbit-play` section and the `.fx-hint` span in `index.html`.

### Updates to the playful extras
- `matrix` / Konami code switch the page to the dark theme while the rain runs, then restore your previous theme (the saved choice is never changed).
- The one-letter shortcuts (p, s, m, f, g, c, t) now wait about 0.6 s and cancel if you keep typing, so typing a hidden word no longer jumps around or flips the theme.
- Each moon in the orbit game has its own look: ringed Projects, banded Skills, Earth-like Research with a small moon, ringed ice-world Contact.
- The scroll-linked morph widget and section-art dissolve were tried and removed.


## Project folders, city footer (`extras.js`, styles at the end of `play.css`)
- **Project folders**: built from the `data-folders="web ml"` attribute on each project card. A project can list several folders. Edit the `FOLDERS` list in `extras.js` to rename or add folders. Hover, tap or press Enter to open; choosing a project scrolls to its card and highlights it.
- **City footer**: a night skyline drawn in SVG (generated in `extras.js`), with people walking, a train, and a waving silhouette of you saying "See you soon!". Change the text in the `bubble` line of `extras.js`. It pauses when off-screen and is still under reduced motion.
- To remove any of them, delete the matching block in `extras.js` (and its CSS); `extras.js` needs uploading with `index.html` and `play.css`.

### Folder and footer refresh
- Project folders are taller and each has its own artwork that animates when opened: a browser with a moving cursor (Web), rising bars and a trend line (Data), a pulsing neural net (ML), a terminal that types (Systems), an atom with orbiting electrons (Science). Each also has a "No. 0X" tape label and a one-line note ("physicist at heart", etc.); edit `FOLDERS` and `ART` in `extras.js`.
- The footer street scene was redrawn with proportioned, walking figures (swinging arms, bending knees), cars and a bus with headlights, trees, street lamps, a metro train and a passing plane. It rebuilds to the screen width.

## Welcome intro (`intro.js`)
Plays once right after someone passes the entry gate (not on reloads in the same visit): the letters of the name slide in from both sides and glow, the name lifts, the photo and three lines appear, then the name breaks into particles that follow a flow-field path and settle into the real hero headline while the dark overlay fades away (a ripple and a Game of Life dissolve were tried and dropped as too much). Click or any key skips; reduced motion gets a short static fade, and any runtime error falls back to a plain fade (`finishCleanly`). Particle count is 420 on desktop and 170 on mobile; tune `N` in `runReveal`. Edit `NAME` and `LINES` at the top of `intro.js`. `gate.js` fires a `portfolio:enter` event that starts it; delete the `intro.js` script tag to turn it off.

## About: class diagram
The diagram beside the About text is now a UML-style class diagram: a central `SnehankurMondal : Person` class (course, base, status, goals, focus, build/learn/solve) linked to `Education`, `Projects` and `Skills` classes. It is inline SVG in `index.html` (`.about-er`); edit the attribute lines there, styles at the end of `play.css`.

## ID card hero and About (`idcard.js`, `idcard.css`)
The hero shows an ID card on a lanyard instead of a profile photo. The card dangles (a damped double pendulum with a slow idle sway), can be dragged and released, and swings when the cursor brushes past. Its links (GitHub, LinkedIn, resume, contact) are real links. The lanyard carries enamel pins: music club headphones, a music-note brooch, a compass and a paper plane.
- **Edit the card:** the markup is the `.id-rig` block in `index.html` (name, role, ID `150102` (also set in `idcard.css` under `.idg-b::after`), base, links). Photo is `pfpic.jpeg`.
- **Edit the pins:** the `PINS` array at the top of `idcard.js` (SVG snippet, which strap, position `t`, tooltip title). Swap the headphones for your club's colours or add a pin.
- **About section** now follows the hero (before Projects). When it scrolls into view the card lifts off the lanyard, flips in mid-air, and lands in the About section as the back of the card, where a scan line reveals the class diagram and the About points are read out as numbered records. Scrolling back to the top returns the card to the lanyard (the empty lanyard keeps swinging). Edit the points in `.ap-list` in `index.html`.
- Reduced motion: static card, no flight, everything visible. Phones: the card sits above the hero text; the About points show as soon as the section is in view.

## Projects: folders as the filter, compact cards, case-file dialog (`projects.js`, `projects.css`)
The folder shelf is now the only filter (the old "Explore by focus" chips are hidden). Click a folder to show just its projects (click again, or "Show all", to clear); hovering still previews the folder's contents. Project cards are compact rows: thumbnail, number, title, one-line summary, three tags and "View details". Clicking a card (or a project in a folder panel) opens a case-file dialog with the full description, links, the folders it is filed under, and the matching case study, with previous/next browsing (arrow keys work). The separate "Case study" list under the grid is hidden because the dialog includes it. All text still lives in the original `.project-card` markup in `index.html` (the dialog reads from it); remove the `projects.js` script tag to get the old full-size cards back.

## Landscape background (`landscape.js`, `landscape.css`)
A fixed layer behind the whole page: sky, far snow peaks, mid hills with pines, near hills with framing trees, and a few drifting leaves. The silhouettes are generated from seeded noise (change the seeds 11 / 23 / 37 in `build()` for different mountains) and drawn once into bitmaps.
- **Camera:** scrolling moves a slow camera through the scene (zoom and sideways drift, by different amounts per layer so the zoom has depth). Edit the `SHOTS` list at the top of `landscape.js`: `z` zoom, `x` drift, `y` tilt toward the city, `t` time of day, per section id.
- **Light:** `t` runs from dawn (0) to night (1) along the page, ending where the night-city footer begins. Palettes are `PAL_DARK` and `PAL_LIGHT` (they follow the theme toggle).
- **Wind:** the leaves react to scroll speed; a fast scroll adds a short streak.
- **Readability:** sections sit on a veil of the page colour (`--a` per section in `landscape.css`); the hero is clear, About is mostly clear, dense sections are heavily veiled. Lower the values to show more landscape.
- Reduced motion: one still frame. Phones: fewer leaves and trees. To remove it, delete the `landscape.js` and `landscape.css` tags from `index.html`.


## Refinement pass (`refine.css`, `motion.js`)
- **Featured vs "also":** five featured projects stay as cards. Cards with `data-tier="also"` in `index.html` (Marine, LocaLens) become slim rows under "Also on the bench". Remove the attribute to promote one.
- **Pin tooltips:** each pin on the lanyard has a `hint` in the `PINS` array in `idcard.js`. Hover, keyboard focus or a tap shows it.
- **Pause motion:** the button in the nav (next to the theme toggle) adds `html.motion-off`, stopping leaves, card swing and CSS animations. The choice is saved in `localStorage` (`portfolio-motion`) and defaults to on if the visitor's system asks for reduced motion.
- **Low-power mode:** `motion.js` adds `html.lite` automatically on weak hardware (2 cores or less, 2 GB or less, Save-Data) or when the first seconds run under about 33 fps. It drops the leaves and backdrop blur.
- **Readability:** the dark theme puts a light veil over each section (`--a` values in `landscape.css`); the light theme has none, because `skeuo.css` makes sections transparent there. The left-edge scrim and the haze bands are also in `landscape.css` / `landscape.js` (`ld-scrim`, `hz[3]`).
- **ID number:** the card shows `150102`. Change it in `index.html` (`.id-rig` and the `#id-dock` head) and in `idcard.css`.

## Living scene (`scene.js`, with `landscape.js`)
- **Behind the peaks:** two depths of clouds, bird flocks every 15-40 s (daytime only), an aurora near the end of the page.
- **Between the hills:** a lake that mirrors the mid hills (painted once per theme/resize) with a CSS glint, and mist that the cursor pushes aside.
- **In front:** rain with the odd flash around Skills/Experience, fireflies at night that drift toward the cursor, a soft light under the cursor.
- **Weather** comes from the time-of-day value `cur.t`: rain peaks at `t = .46`, aurora fades in after `t = .78` (see `weather()` in `scene.js`).
- **Art:** `paintLayers()` in `landscape.js` adds a lit edge on every ridge/treetop and a top-to-foot shading; the near hills have grass blades.
- **Camera:** `y` values in `SHOTS` tilt the camera per section.
- Pause motion or lite mode leave still clouds only. Remove the `scene.js` script tag to turn the whole scene off.

## Live clock + weather (`weather.js`)
- A chip in the nav shows a live clock (of the place whose weather is shown) and the temperature; clicking it opens a small panel.
- **Place:** Delhi NCR by default. "Use my location" asks the browser for permission; coordinates are never stored, only the preference. A returning visitor who already allowed it gets their own weather without a new prompt.
- **Data:** Open-Meteo (no key), place name from BigDataCloud (falls back to "Your location"). Cached for 10 minutes, refreshed every 15. If a request fails, the clock stays and the scene stays calm.
- **Scene:** weather codes steer cloud cover, mist, rain, snow, thunder flashes and wind speed (`window.LiveWeather`, read by `scene.js` and the leaves in `landscape.js`). The scripted rain patch is gone; it only rains when it rains.
- **Preview** any condition: add `?wx=clear`, `cloudy`, `fog`, `rain`, `storm` or `snow` to the page URL.

## Quote sky and light-theme contrast (`quote-stars.js`, end of `refine.css`)
- The "A line I carry with me" section has a small star field and three constellations (Saptarshi pointing to Polaris, Cassiopeia, Orion) that draw themselves when the section scrolls into view. Star data is at the top of `quote-stars.js` (`CONS`).
- In the light theme that section becomes a night-sky panel so the stars can glow.
- Light theme contrast: darker ink/muted text, firmer card borders and shadows, more opaque glass, and a slightly deeper landscape palette (`landscape.css`).
