/**
 * @file
 * Running of the PHPCS/PHPCBF executables.
 */

const { dirname, resolve, sep } = require('path');
const { FileSystemError, Uri, workspace } = require('vscode');
const { mapToCliArgs, executeCommand } = require('./cli');

/**
 * PHPCBF run.
 *
 * @callback phpcbfRun
 *
 * @param {string} stdin
 *   Input to pass to command as STDIN.
 *
 * @return {Promise<string>}
 *   Formatting result.
 */

/**
 * PHPCS run.
 *
 * @callback phpcsRun
 *
 * @param {string} stdin
 *   Input to pass to command as STDIN.
 * @param {number|false} [tabWidth=false]
 *   If input is using tabs, the indent length of a tab from VSCode.
 *
 * @return {Promise<import('./phpcs-report').PHPCSEnhancedReport|null>}
 *   The report from PHPCS or `null` if cancelled.
 */

/**
 * Runner object.
 *
 * @typedef {object} Runner
 *
 * @property {phpcbfRun} phpcbf
 *   Runs PHPCBF.
 * @property {phpcsRun} phpcs
 *   Runs PHPCS.
 */

/**
 * Resolves the folder where the executables exist.
 *
 * @param {import('vscode').WorkspaceConfiguration} config
 *   The phpSniffer configuration.
 * @param {import('vscode').WorkspaceFolder} [folder]
 *   The current workspace folder.
 *
 * @return {Promise<string>}
 *   Path to a folder where the executables exist (with trailing slash).
 */
async function resolveRunFolder(config, folder) {
  let result = config.get('executablesFolder', '');

  // Search for ./vendor/bin/phpcs.
  // Would use RelativePath and workspace.findFiles() but does not seem to work
  // for remote file systems with symlinked files.
  if (folder && config.get('autoDetect') && !result) {
    const maybePath = resolve(folder.uri.fsPath, 'vendor/bin/phpcs');

    try {
      await workspace.fs.stat(Uri.file(maybePath));
      result = dirname(maybePath);
    } catch (err) {
      // Not an error we expect; re-throw.
      if (!(err instanceof FileSystemError)) {
        throw err;
      }
    }
  }

  return result && !result.endsWith(sep) ? `${result}${sep}` : result;
}

/**
 * Creates a runner for an excutable.
 *
 * @param {import('vscode').CancellationToken} token
 *   Cancellation token.
 * @param {import('vscode').Uri} uri
 *   The document URI to create a runner from.
 * @param {boolean} [fullDocument=true]
 *   Whether the document to be processed is for a full document.
 *
 * @return {Runner}
 *   The runner object.
 */
const createRunner = (token, uri, fullDocument = true) => {
  if (uri.scheme !== 'file') {
    return {
      phpcbf: (stdin) => Promise.resolve(stdin),
      phpcs: () => Promise.resolve(null),
    };
  }

  const VSConfig = workspace.getConfiguration('phpSniffer', uri);
  const directory = workspace.getWorkspaceFolder(uri);

  const standard = VSConfig.get('standard');
  const runFolder = resolveRunFolder(VSConfig, directory);

  const spawnOptions = {
    cwd: directory ? directory.uri.fsPath : undefined,
    shell: process.platform === 'win32',
  };

  const args = new Map([
    ['report', 'json'],
    ['bootstrap', resolve(__dirname, 'files.php')],
  ]);
  if (uri.scheme === 'file') {
    args.set('stdin-path', uri.fsPath);
    // Use the same logic that is in PHP_CodeSniffer to parse the file's
    // extension (see https://github.com/PHPCSStandards/PHP_CodeSniffer/blob/3.5.8/src/Files/File.php#L242).
    args.set('extensions', uri.path.split('.').pop() || '');
  }
  if (standard) args.set('standard', standard);

  /** @type string[] */
  const excludes = fullDocument ? [] : VSConfig.get('snippetExcludeSniffs', []);

  return {
    async phpcbf(stdin) {
      if (excludes.length) {
        args.set('exclude', excludes.join(','));
      }

      // PHPCBF uses unconventional exit codes, see
      // https://github.com/squizlabs/PHP_CodeSniffer/issues/1270#issuecomment-272768413
      // phpcs 4.x: exit 0 = no changes, exit 1 = all fixed, exit 2 = partial fix (stdout has
      // partially fixed content), exit 3+ = error.
      const phpcbfResult = await executeCommand({
        command: `${await runFolder}phpcbf`,
        token,
        args: [...mapToCliArgs(args, !!spawnOptions.shell), '-'],
        stdin,
        spawnOptions,
        exitCodeThreshold: 2,
      });
      // exitCode 0: no changes needed — phpcbf writes nothing to stdout, fall back to stdin
      // exitCode 1-2: changes made — phpcbf writes fixed content to stdout
      return phpcbfResult || stdin;
    },
    async phpcs(stdin) {
      args.set(
        'bootstrap',
        `${args.get('bootstrap')},${resolve(__dirname, 'tab-width.php')}`,
      );

      const result = await executeCommand({
        command: `${await runFolder}phpcs`,
        token,
        stdin,
        args: [
          ...mapToCliArgs(args, !!spawnOptions.shell),
          // Ensure quiet output to override any output settings from config.
          // Ensures we get JSON only.
          '-q',
          // Read stdin.
          '-',
        ],
        spawnOptions,
        // phpcs 4.x exits with code 3 when errors are found and some are fixable
        // (shifted by 1 vs 3.x). Accept exit codes 0-3 as successful JSON output.
        exitCodeThreshold: 3,
      });

      // Extra '}' to resolve to correct JSON from extra output in tab-width.php.
      return result ? JSON.parse(`${result}}`) : null;
    },
  };
};
module.exports.createRunner = createRunner;
