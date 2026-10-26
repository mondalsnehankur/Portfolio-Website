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
