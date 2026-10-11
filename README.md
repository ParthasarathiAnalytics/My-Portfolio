# Parthasarathi A — Cinematic Data Analytics Portfolio

A responsive static portfolio built with semantic HTML, CSS, and vanilla JavaScript. No npm install or build step is required.

## Run locally (Windows)
1. Extract the ZIP.
2. Open the `parthasarathi-advanced-portfolio` folder in VS Code.
3. Open Terminal in that folder and run:
   ```powershell
   python -m http.server 8000
   ```
   If `python` is unavailable, try `py -m http.server 8000`.
4. Visit http://localhost:8000.

Opening `index.html` directly also works for most features, but the local server is recommended.

## Deploy to Vercel
1. Push this folder to a GitHub repository.
2. Import that repository in Vercel.
3. Choose **Other** as the framework preset.
4. Leave Build Command blank.
5. Set Output Directory to `.` and deploy.

## Included assets
- Supplied profile photo and LIVEWIRE Hopes, KGiSL, and SMS College logos
- Resume PDF and course/internship certificates
- Custom project preview illustrations

## Cinematic interactions

- Scroll-reveal sections and clipped heading reveals
- Staggered content entrance on major grids
- Pointer-follow card highlight and image drift on desktop
- Subtle magnetic movement on key links and buttons
- Scroll-linked portrait parallax on desktop only
- Top progress indicator, section-aware navigation, and click feedback
- Mobile/reduced-motion fallbacks to keep motion light and accessible

## Interactions
- Light/dark theme toggle with saved preference
- Responsive navigation and active-section highlight
- Smooth scrolling, section reveals, and button feedback
- Project category filters
- Header Resume link opens the PDF in a new tab
- Hero Download Resume button downloads the PDF directly
- Contact form prepares an email draft; no fake backend success message

## Project repository note
The “Web Scraping & ML Mobile Data Prediction” card currently points to the previously supplied Web Scraping repository URL because a separate repository URL was not provided. Update the link in `index.html` if the mobile-data prediction project has a different repository.


## Cinematic WebGL / scrollytelling layer

The page includes a Three.js shader-driven ambient scene that scrubs through the page as you scroll, with pointer-responsive lighting, drifting particles, a film-grain overlay, and cinematic text reveals. The Three.js module is loaded from jsDelivr when the page is online. If WebGL, the CDN, or the browser capability is unavailable, the portfolio keeps its CSS-based reveals, hover effects, and content as a graceful fallback. For the full WebGL atmosphere, use the local server command above with an internet connection.


## Sticky navbar + cinematic 3D layer

- The original navbar layout, typography, links, Resume link, and Dark Mode toggle are preserved.
- Navbar uses `position: sticky`, a high stacking order, and fully opaque light/dark backgrounds to prevent content bleed-through.
- A Three.js WebGL layer includes a shader atmosphere, animated particles, a rotating wireframe knot, and orbit rings. This creates a lightweight, looping 3D motion scene rather than a large prerecorded video file.
- WebGL loads Three.js from jsDelivr, so the full 3D layer requires an internet connection. The regular portfolio remains usable if the CDN/WebGL is unavailable.


## Latest visual update
- Added burgundy accents with theme-aware contrast corrections.
- Added animated motion-graphic orbits, light beams, floating nodes, and subtle pointer response.
- Updated display typography to Cormorant Garamond and body typography to Manrope, with fallbacks.
- Honors prefers-reduced-motion and uses CSS-only motion graphics as a graceful companion to the optional Three.js WebGL background.


## Readability & visual update
- Increased body, project, form, and metadata text sizes.
- Fixed light-theme contact text contrast and preserved a high-contrast dark-theme contact section.
- Added custom SVG icons for Excel, SQL, Power BI, Python, and Machine Learning.
- Added burgundy pointer-follow glow and hover feedback across project/tool/credential cards.


## Theme and phone interactions

- The site opens in dark mode on a first visit. The hanging burgundy/gold pull cord can be clicked or dragged downward to switch between dark and light themes; the choice is saved.
- The availability indicator uses a soft green pulse.
- Tool logos appear in both Core Tools and Expertise, with local SVG icons for GitHub, Google Colab, and VS Code.
- Clicking the phone contact copies the phone number and then opens the device dialler using the `tel:` link. Clipboard access is best supported on HTTPS or localhost.


## Motion details

- The theme rope gently sways like a cord moved by airflow; click or pull it to switch themes.
- The green availability beacon blinks and emits a soft pulse.
- The hero includes a live mechanical flip-style clock showing Coimbatore / India Standard Time (IST), updated every second.


## Theme contrast audit
The dark cinematic intro band uses fixed light foreground text in both themes so text cannot inherit the dark `--paper` token and disappear on the dark background. Key supporting copy is also explicitly tuned for dark and light themes.


## Latest interaction update
- Removed the live clock entirely.
- Theme cord uses a requestAnimationFrame damped pendulum simulation with wind variation, pointer impulses, scroll-velocity nudges, elastic pull and knob lag.
- Animation pauses when the tab is hidden or the cord is offscreen and respects reduced-motion preferences. Keyboard activation still toggles the theme.
- Added icons to EDA, Statistics, Data Cleaning and KPI Reporting chips.
- Added a floating accessible Back to Top button that appears after scrolling.
