const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../build/assets');
const MAX_ENTRY_BYTES = 380 * 1024;

if (!fs.existsSync(assetsDir)) {
  console.warn('bundle:check skipped; build/assets not found.');
  process.exit(0);
}

const entryFiles = fs
  .readdirSync(assetsDir)
  .filter(file => /^index-.*\.js$/.test(file))
  .map(file => {
    const filePath = path.join(assetsDir, file);
    return { file, size: fs.statSync(filePath).size };
  })
  .sort((a, b) => b.size - a.size);

const largest = entryFiles[0];
if (!largest) {
  console.warn('bundle:check skipped; no index bundle found.');
  process.exit(0);
}

if (largest.size > MAX_ENTRY_BYTES) {
  console.error(
    `bundle:check failed: ${largest.file} is ${(largest.size / 1024).toFixed(1)} KiB, limit is ${(
      MAX_ENTRY_BYTES / 1024
    ).toFixed(0)} KiB.`
  );
  process.exit(1);
}

console.log(`bundle:check passed: ${largest.file} ${(largest.size / 1024).toFixed(1)} KiB.`);
