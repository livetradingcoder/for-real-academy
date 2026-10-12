# Handoff: deploy For Real Academy to Vercel

Paste this file into a Claude Code session that has Vercel access (CLI login, `VERCEL_TOKEN`, or a Vercel connector).

## Project
- Repo: https://github.com/livetradingcoder/for-real-academy (branch `main`)
- Static site, plain HTML/CSS/JS. **No build step, no dependencies.**
- Entry: `index.html`. Other pages: `terms.html`, `privacy.html`, `refunds.html`, `success.html`, `cancel.html`.
- Config: `config.js` (courses, prices, Polar checkout links).
- Local preview: `python3 -m http.server 8792`

## Task
1. Clone the repo (or use the local checkout).
2. Deploy it to Vercel as a static site:
   - Framework preset: **Other**
   - Build command: none
   - Output directory: `.` (repo root)
   - Run `vercel --prod` (link to a new project named `for-real-academy`), or import the GitHub repo in the Vercel dashboard so every push to `main` auto-deploys.
3. Open the production URL and check that these load with no errors: `/`, `/terms.html`, `/privacy.html`, `/refunds.html`, `/success.html`, `/cancel.html`.
4. Check that all four course cards render, each with a Curriculum dropdown and a pay-in-full / 3-payments toggle.
5. Report the production URL.

## Do not
- Do not add trading, forex or financial-strategy content. The site is web development and AI tools only (Polar rejected a prior trading site).
- Do not invent testimonials, instructor names or income claims.
- Do not commit tokens or secrets.

## After deploy (the owner does these)
- Add the custom domain in Vercel (Settings, Domains).
- Read `CONTENT-TO-VERIFY.md`, then set real prices and Polar checkout links in `config.js`.
- Apply to Polar using the live domain, and disclose the related Algo Trading School business honestly.
