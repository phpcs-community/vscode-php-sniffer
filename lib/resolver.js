/**
 * @file
 * Executable and config file resolution for phpcs/phpcbf.
 */

const { execFile } = require('child_process');
const { dirname, resolve, sep } = require('path');
const { FileSystemError, Uri, workspace } = require('vscode');
const { parseMajorVersion } = require('./version');

const CONFIG_FILES = [
  'phpcs.xml',
  '.phpcs.xml',
  'phpcs.xml.dist',
  '.phpcs.xml.dist',
];

/**
 * Walks up from startDir looking for vendor/bin/phpcs.
 * Returns the vendor/bin directory path or null if not found.
 *
 * @param {string} startDir
 * @return {Promise<string|null>}
 */
async function findVendorBin(startDir) {
  let dir = startDir;
  while (true) {
    const candidate = resolve(dir, 'vendor/bin/phpcs');
    try {
      await workspace.fs.stat(Uri.file(candidate));
      return dirname(candidate); // vendor/bin
    } catch (err) {
      if (!(err instanceof FileSystemError)) throw err;
    }
    const parent = dirname(dir);
    if (parent === dir) return null; // reached filesystem root
    dir = parent;
  }
}

/**
 * Resolves the folder containing phpcs/phpcbf executables.
 * Returns path with trailing sep, or '' for global PATH.
 *
 * @param {import('vscode').WorkspaceConfiguration} config
 * @param {import('vscode').WorkspaceFolder} [folder]
 * @return {Promise<string>}
 */
async function resolveExecutableFolder(config, folder) {
  const manual = config.get('executablesFolder', '');
  if (manual) return manual.endsWith(sep) ? manual : `${manual}${sep}`;

  if (folder && config.get('autoDetect')) {
    const found = await findVendorBin(folder.uri.fsPath);
    if (found) return `${found}${sep}`;
  }

  return '';
}

const _cache = new Map();

/**
 * Cached version of resolveExecutableFolder.
 * Call clearCache() when configuration changes.
 *
 * @param {import('vscode').WorkspaceConfiguration} config
 * @param {import('vscode').WorkspaceFolder} [folder]
 * @return {Promise<string>}
 */
async function resolveExecutableFolderCached(config, folder) {
  // Cache keyed by folder fsPath — each workspace root gets its own resolved executable path.
  // Note: config is expected to be scoped to the same folder, so the key is sufficient.
  // Call clearCache() on configuration changes to avoid stale entries.
  const key = folder ? folder.uri.fsPath : '';
  if (_cache.has(key)) return _cache.get(key);
  const result = await resolveExecutableFolder(config, folder);
  _cache.set(key, result);
  return result;
}

/**
 * Clears the executable folder resolution cache.
 */
function clearCache() {
  _cache.clear();
}

/**
 * Finds the nearest PHPCS config file by walking up from startDir.
 * Returns the full path to the config file, or null if none found.
 *
 * @param {string} startDir
 * @return {Promise<string|null>}
 */
async function findNearestConfig(startDir) {
  let dir = startDir;
  while (true) {
    for (const name of CONFIG_FILES) {
      const candidate = resolve(dir, name);
      try {
        await workspace.fs.stat(Uri.file(candidate));
        return candidate;
      } catch (err) {
        if (!(err instanceof FileSystemError)) throw err;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Runs `phpcs --version` and returns the version string, or null on failure.
 *
 * @param {string} execFolder
 *   The folder containing the phpcs executable (with trailing sep), or '' for PATH.
 * @return {Promise<string|null>}
 */
async function detectPhpcsVersion(execFolder) {
  return new Promise((resolve) => {
    const cmd = execFolder ? `${execFolder}phpcs` : 'phpcs';
    execFile(cmd, ['--version'], { timeout: 5000 }, (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      const match = stdout.match(/version\s+([\d.]+)/i);
      resolve(match ? match[1] : null);
    });
  });
}

module.exports = {
  resolveExecutableFolderCached,
  findNearestConfig,
  clearCache,
  detectPhpcsVersion,
  parseMajorVersion,
};
