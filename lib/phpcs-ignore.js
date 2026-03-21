/**
 * @file
 * Logic for finding and applying .phpcsignore patterns.
 */

const { readFileSync } = require('fs');
const { basename, dirname, resolve } = require('path');

/**
 * Walks up from startDir looking for a `.phpcsignore` file.
 * Returns the file content as a string, or null if not found.
 *
 * @param {string} startDir
 * @return {string|null}
 */
function findPhpcsIgnore(startDir) {
  let dir = startDir;
  while (true) {
    const candidate = resolve(dir, '.phpcsignore');
    try {
      return readFileSync(candidate, 'utf8');
    } catch (_) {
      // not found at this level, keep walking
    }
    const parent = dirname(dir);
    if (parent === dir) return null; // reached filesystem root
    dir = parent;
  }
}

/**
 * Tests whether a single gitignore-style pattern matches a file path.
 * Patterns containing `/` are matched against the full path;
 * patterns without `/` are matched against just the filename.
 *
 * @param {string} pattern
 * @param {string} filePath
 * @return {boolean}
 */
function matchesIgnorePattern(pattern, filePath) {
  const target = pattern.includes('/') ? filePath : basename(filePath);
  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape regex special chars
    .replace(/\*/g, '[^/]*')               // * matches anything except /
    .replace(/\?/g, '[^/]');               // ? matches single char except /
  return new RegExp(`^${regexStr}$`).test(target);
}

/**
 * Returns true if the given file path is matched by a `.phpcsignore` pattern
 * found by walking up the directory tree from the file's directory.
 *
 * @param {string} filePath
 * @return {boolean}
 */
function isIgnoredByPhpcs(filePath) {
  const content = findPhpcsIgnore(dirname(filePath));
  if (content === null) return false;

  const patterns = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  return patterns.some((pattern) => matchesIgnorePattern(pattern, filePath));
}

module.exports = { findPhpcsIgnore, matchesIgnorePattern, isIgnoredByPhpcs };
