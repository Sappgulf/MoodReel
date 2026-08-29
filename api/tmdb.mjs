// Vercel discovers serverless functions in `<project root>/api`, and this
// project's root directory is the repository root (the root vercel.json builds
// with `cd moodreel && ...`). The implementation lives beside the web app in
// `moodreel/api/`, so this re-exports it to give the function a discoverable
// entry point. Without it `/api/tmdb` falls through to the SPA rewrite and
// returns index.html, which leaves the deployed app with no working TMDB
// transport at all.
//
// `.mjs` because there is no package.json at the repository root, so a plain
// `.js` file here would be treated as CommonJS.
export { default } from '../moodreel/api/tmdb.js';
