/**
 * @file
 * Running of the PHPCS/PHPCBF executables.
 */

const { resolve, dirname } = require('path');
const { workspace } = require('vscode');
const { mapToCliArgs, executeCommand } = require('./cli');
const { resolveExecutableFolderCached } = require('./resolver');

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
  const timeout = VSConfig.get('timeout', 30);
  const runFolder = resolveExecutableFolderCached(VSConfig, directory);

  const workingDirectory = VSConfig.get('workingDirectory', 'auto');
  let cwd;
  if (workingDirectory === 'fileDir') {
    cwd = dirname(uri.fsPath);
  } else if (workingDirectory === 'workspaceRoot') {
    cwd = directory ? directory.uri.fsPath : undefined; // no fallback — strict workspace root
  } else {
    // auto: workspace root if available, file dir otherwise
    cwd = directory ? directory.uri.fsPath : dirname(uri.fsPath);
  }

  const spawnOptions = {
    cwd,
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
      const localArgs = new Map(args);
      if (excludes.length) {
        localArgs.set('exclude', excludes.join(','));
      }

      // PHPCBF uses unconventional exit codes, see
      // https://github.com/squizlabs/PHP_CodeSniffer/issues/1270#issuecomment-272768413
      // phpcs 4.x: exit 0 = no changes, exit 1 = all fixed, exit 2 = partial fix (stdout has
      // partially fixed content), exit 3+ = error.
      const phpcbfResult = await executeCommand({
        command: `${await runFolder}phpcbf`,
        token,
        args: [...mapToCliArgs(localArgs, !!spawnOptions.shell), '-'],
        stdin,
        spawnOptions,
        exitCodeThreshold: 2,
        timeout,
      });
      // exitCode 0: no changes needed — phpcbf writes nothing to stdout, fall back to stdin
      // exitCode 1-2: changes made — phpcbf writes fixed content to stdout
      return phpcbfResult ? phpcbfResult.stdout || stdin : stdin;
    },
    async phpcs(stdin) {
      const localArgs = new Map(args);
      localArgs.set(
        'bootstrap',
        `${localArgs.get('bootstrap')},${resolve(__dirname, 'tab-width.php')}`,
      );

      const result = await executeCommand({
        command: `${await runFolder}phpcs`,
        token,
        stdin,
        args: [
          ...mapToCliArgs(localArgs, !!spawnOptions.shell),
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
        timeout,
      });

      if (!result) return null;

      let tabWidth = 1;
      try {
        const stderrData = JSON.parse(result.stderr);
        if (typeof stderrData.tabWidth === 'number') {
          tabWidth = stderrData.tabWidth;
        }
      } catch {
        // stderr unparseable or empty — use safe default of 1
      }

      return {
        vscodeOptions: { tabWidth },
        result: JSON.parse(result.stdout),
      };
    },
  };
};
module.exports.createRunner = createRunner;
