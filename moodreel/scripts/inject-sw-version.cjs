/**
 * After Vite copies `public/` into `build/`, stamp a new cache version so
 * the service worker picks up fresh assets on deploy.
 */
const fs = require('fs');
const path = require('path');

const buildSw = path.join(__dirname, '../build/service-worker.js');
if (!fs.existsSync(buildSw)) {
  console.warn('inject-sw-version: build/service-worker.js not found, skipping.');
  process.exit(0);
}

const stamp = Math.floor(Date.now() / 1000);
let body = fs.readFileSync(buildSw, 'utf8');

if (!/const CACHE_VERSION = \d+/.test(body)) {
  console.warn('inject-sw-version: CACHE_VERSION pattern not found, skipping.');
  process.exit(0);
}

body = body.replace(/const CACHE_VERSION = \d+/, `const CACHE_VERSION = ${stamp}`);
fs.writeFileSync(buildSw, body);
console.log(`inject-sw-version: CACHE_VERSION = ${stamp}`);
