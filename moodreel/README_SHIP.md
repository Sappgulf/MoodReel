# MoodReel Web Ship Guide

## Runtime

- Framework: Vite + React 18
- Entry files: `src/main.jsx`, `src/App.jsx`
- Build output: `build/`

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
npm run test:unit
npm run verify
```

## Environment

- Required: `VITE_TMDB_API_KEY`
- Optional: `VITE_TMDB_BASE_URL`
- Legacy-only compatibility aliases: `REACT_APP_TMDB_API_KEY`, `REACT_APP_TMDB_BASE_URL`

## Deploy notes

- Root `vercel.json` builds from `moodreel/`.
- `moodreel/vercel.json` supports using `moodreel/` as project root in Vercel.
