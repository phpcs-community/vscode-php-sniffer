/**
 * @file
 * Logic for finding and applying .phpcsignore patterns.
 */

const { readFileSync } = require('fs');
const { basename, dirname, resolve } = require('path');

/** @type {Map<string, string|null>} */
const ignoreFileCache = new Map();

/**
 * Walks up from startDir looking for a `.phpcsignore` file.
 * Returns the file content as a string, or null if not found.
 * Results are cached per directory.
 *
 * @param {string} startDir
 * @return {string|null}
 */
function findPhpcsIgnore(startDir) {
  if (ignoreFileCache.has(startDir)) return ignoreFileCache.get(startDir);

  let dir = startDir;
  let result = null;
  while (true) {
    const candidate = resolve(dir, '.phpcsignore');
    try {
      result = readFileSync(candidate, 'utf8');
      break;
    } catch (_) {
      // not found at this level, keep walking
    }
    const parent = dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }

  ignoreFileCache.set(startDir, result);
  return result;
}

/**
 * Clears the ignore file cache. Call when settings change.
 */
function clearIgnoreCache() {
  ignoreFileCache.clear();
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
  if (!pattern.includes('/')) {
    // No slash: match against basename only
    const regexStr = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');
    return new RegExp(`^${regexStr}$`).test(basename(filePath));
  }

  // Trailing-slash: directory pattern (e.g. "vendor/")
  if (pattern.endsWith('/')) {
    const dir = pattern
      .slice(0, -1)
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]');
    return new RegExp(`[/\\\\]${dir}[/\\\\]`).test(filePath);
  }

  const regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]');

  if (pattern.startsWith('/')) {
    // Absolute anchor — match against full path from root
    return new RegExp(`^${regexStr}$`).test(filePath);
  }

  // Relative pattern — match as suffix of path (any depth)
  return new RegExp(`(^|[/\\\\])${regexStr}$`).test(filePath);
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

module.exports = { findPhpcsIgnore, matchesIgnorePattern, isIgnoredByPhpcs, clearIgnoreCache };
