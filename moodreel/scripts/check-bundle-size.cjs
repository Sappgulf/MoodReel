const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const assetsDir = path.join(__dirname, '../build/assets');
const MAX_ENTRY_BYTES = 380 * 1024;
const MAX_GZIP_BYTES = 150 * 1024;

function gzipSize(filePath) {
  const buf = fs.readFileSync(filePath);
  return zlib.gzipSync(buf).length;
}

if (!fs.existsSync(assetsDir)) {
  console.warn('bundle:check skipped; build/assets not found.');
  process.exit(0);
}

const entryFiles = fs
  .readdirSync(assetsDir)
  .filter(file => /^index-.*\.js$/.test(file))
  .map(file => {
    const filePath = path.join(assetsDir, file);
    return { file, size: fs.statSync(filePath).size, gz: gzipSize(filePath) };
  })
  .sort((a, b) => b.size - a.size);

const largest = entryFiles[0];
if (!largest) {
  console.warn('bundle:check skipped; no index bundle found.');
  process.exit(0);
}

let failed = false;

if (largest.size > MAX_ENTRY_BYTES) {
  console.error(
    `bundle:check failed: ${largest.file} is ${(largest.size / 1024).toFixed(1)} KiB raw, limit is ${(
      MAX_ENTRY_BYTES / 1024
    ).toFixed(0)} KiB.`
  );
  failed = true;
}

if (largest.gz > MAX_GZIP_BYTES) {
  console.error(
    `bundle:check failed: ${largest.file} is ${(largest.gz / 1024).toFixed(1)} KiB gzipped, limit is ${(
      MAX_GZIP_BYTES / 1024
    ).toFixed(0)} KiB.`
  );
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log(
  `bundle:check passed: ${largest.file} ${(largest.size / 1024).toFixed(1)} KiB raw / ${(
    largest.gz / 1024
  ).toFixed(1)} KiB gzipped.`
);
