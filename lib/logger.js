/**
 * @file
 * Contains logging utilities.
 */

const { workspace } = require('vscode');

// Log levels (ordered by severity)
const LEVELS = { off: 0, error: 1, info: 2, debug: 3 };

/**
 * Get configured log level from VS Code settings.
 *
 * @return {string}
 *   The configured log level.
 */
function getLevel() {
  return workspace.getConfiguration('phpSniffer').get('logLevel', 'error');
}

/**
 * Log a message at the given level.
 *
 * @param {import('vscode').OutputChannel} channel
 *   The output channel to log to.
 * @param {string} level
 *   The log level ('error', 'info', 'debug').
 * @param {string} message
 *   The message to log.
 */
function log(channel, level, message) {
  const configuredLevel = getLevel();
  if (
    LEVELS[level] === undefined ||
    LEVELS[level] > LEVELS[configuredLevel] ||
    LEVELS[configuredLevel] === 0
  ) {
    return;
  }
  const ts = new Date().toTimeString().slice(0, 8);
  channel.appendLine(`[${ts}] [${level.toUpperCase()}] ${message}`);

  // Auto-reveal channel on error if configured
  if (
    level === 'error' &&
    workspace.getConfiguration('phpSniffer').get('showOutputOnError', true)
  ) {
    channel.show(true); // true = preserve focus (don't steal focus)
  }
}

module.exports = { log };
