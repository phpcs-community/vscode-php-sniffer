/**
 * Publishes to Open VSX under the phpcs-community namespace.
 *
 * Open VSX namespace is phpcs-community, VS Marketplace publisher is phpcscommunity.
 * This script temporarily patches package.json, publishes, then restores it.
 */

const fs = require('fs');
const { execFileSync } = require('child_process');

const PKG_PATH = `${__dirname}/../package.json`;
const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
const original = pkg.publisher;

try {
  pkg.publisher = 'phpcs-community';
  fs.writeFileSync(PKG_PATH, `${JSON.stringify(pkg, null, 4)}\n`);
  execFileSync('npx', ['ovsx', 'publish'], { stdio: 'inherit', shell: true });
} finally {
  pkg.publisher = original;
  fs.writeFileSync(PKG_PATH, `${JSON.stringify(pkg, null, 4)}\n`);
}
