# HCI Quiz

A fast, mobile-first web app for practising **120 MCQs** from the NPTEL Human-Computer Interaction course (Weeks 1–12).

---

## Features

- **120 questions** covering all 12 weeks of the NPTEL HCI syllabus
- **Week filter** — practice the full set or drill specific weeks
- **Randomized order** on every session
- **Progress bar** tracking answers in real time
- **Score ring** with animated percentage on submit
- **Full answer review** filterable by Correct / Wrong / Skipped
- **Mobile-first design** — built and optimized for phone browsers
- **Vercel-ready** — pure static files, no build step

---

## Tech Stack

| Layer       | Choice                         |
|-------------|--------------------------------|
| Markup      | HTML5                          |
| Styles      | Vanilla CSS (mobile-first)     |
| Logic       | Vanilla JavaScript (ES6+)      |
| Fonts       | Inter + Space Grotesk (Google) |
| Hosting     | Vercel (static)                |

---

## Project Structure

```
hci-quiz/
├── index.html       # Single-page app (Home / Quiz / Results)
├── style.css        # Dark glassmorphic design system
├── app.js           # Quiz logic — shuffle, scoring, review
├── questions.js     # All 120 MCQs as a JS array
├── vercel.json      # Vercel static deployment config
├── package.json     # Dev server helper (npx serve)
├── .gitignore
└── README.md
```

---

## Local Development

```bash
npm run dev
# Serves the app at http://localhost:3000
```

> Requires Node.js. The `serve` package is installed automatically via `npx`.

---

## Deploy to Vercel

1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Vercel detects it as a static site automatically — click **Deploy**.

No framework, no build step, no configuration needed beyond `vercel.json`.

---

## Question Data

All 120 questions are stored in `questions.js` as a plain JavaScript array. Each entry has:

```js
{
  id: 1,
  week: 1,
  question: "What is the primary goal of HCI?",
  options: ["Option A", "Option B", "Option C", "Option D"],
  answer: 1   // zero-based index of the correct option
}
```

---

## License

MIT
