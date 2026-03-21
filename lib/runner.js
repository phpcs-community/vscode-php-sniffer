/**
 * @file
 * Running of the PHPCS/PHPCBF executables.
 */

const { resolve, dirname } = require('path');
const { workspace } = require('vscode');
const { mapToCliArgs, executeCommand } = require('./cli');
const { resolveExecutableFolderCached } = require('./resolver');
const { log } = require('./logger');

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
 * @param {import('vscode').OutputChannel|null} [channel=null]
 *   Optional output channel for structured logging.
 *
 * @return {Runner}
 *   The runner object.
 */
const createRunner = (token, uri, fullDocument = true, channel = null) => {
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
    // Only pass --extensions when there is a real file extension; phpcs 4.x
    // rejects values that look like paths (e.g. directories or extensionless files).
    const filename = uri.path.split('/').pop() || '';
    const dotIdx = filename.lastIndexOf('.');
    const ext = dotIdx > 0 ? filename.slice(dotIdx + 1) : '';
    if (ext) args.set('extensions', ext);
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

      if (channel) {
        log(channel, 'info', `phpcbf: ${uri.fsPath}`);
        log(channel, 'info', `Working dir: ${cwd}`);
        log(
          channel,
          'debug',
          `Command: ${await runFolder}phpcbf ${mapToCliArgs(localArgs, !!spawnOptions.shell).join(' ')} -`,
        );
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
      if (!phpcbfResult) return stdin; // cancelled, return input unchanged
      const { stdout: phpcbfStdout } = phpcbfResult;
      // phpcbf v3 writes status text (not file content) to stdout when a file is
      // excluded by phpcs config (e.g. "No violations were found\n\nTime: ...").
      // phpcbf v4 exits with a non-zero code for excluded files instead.
      // Detect status text and treat as no changes to avoid replacing the document.
      if (
        phpcbfStdout &&
        phpcbfStdout.trimStart().startsWith('No violations were found')
      ) {
        return stdin;
      }
      // exitCode 0: no changes needed — phpcbf writes nothing to stdout, fall back to stdin
      // exitCode 1-2: changes made — phpcbf writes fixed content to stdout
      return phpcbfStdout || stdin;
    },
    async phpcs(stdin) {
      const localArgs = new Map(args);
      localArgs.set(
        'bootstrap',
        `${localArgs.get('bootstrap')},${resolve(__dirname, 'tab-width.php')}`,
      );

      if (channel) {
        log(channel, 'info', `phpcs: ${uri.fsPath}`);
        log(channel, 'info', `Working dir: ${cwd}`);
        log(
          channel,
          'debug',
          `Command: ${await runFolder}phpcs ${mapToCliArgs(localArgs, !!spawnOptions.shell).join(' ')} --runtime-set ignore_warnings_on_exit 1 --runtime-set ignore_errors_on_exit 1 -q -`,
        );
      }

      let result;
      try {
        result = await executeCommand({
          command: `${await runFolder}phpcs`,
          token,
          stdin,
          args: [
            ...mapToCliArgs(localArgs, !!spawnOptions.shell),
            // Suppress non-zero exit when warnings/errors are found so we can
            // always parse the JSON report regardless of violation count.
            '--runtime-set', 'ignore_warnings_on_exit', '1',
            '--runtime-set', 'ignore_errors_on_exit', '1',
            // Ensure quiet output to override any output settings from config.
            // Ensures we get JSON only.
            '-q',
            // Read stdin.
            '-',
          ],
          spawnOptions,
          exitCodeThreshold: 0,
          timeout,
        });
      } catch (error) {
        // phpcs 4.x exits with a non-zero error code when all stdin paths are
        // excluded by <file> directives (via the files.php bootstrap). Treat
        // this as a successful run with no violations rather than an error.
        if (error.stderr && error.stderr.includes('No files were checked')) {
          return {
            vscodeOptions: { tabWidth: 1 },
            result: { totals: { errors: 0, warnings: 0, fixable: 0 }, files: {} },
          };
        }
        // Fallback for phpcs versions that ignore --runtime-set flags (pre-3.3.1):
        // if stdout is valid JSON with a totals field, treat it as a normal report
        // rather than failing on the non-zero exit code.
        if (error.stdout) {
          try {
            const parsed = JSON.parse(error.stdout);
            if (parsed && typeof parsed.totals === 'object') {
              let tabWidth = 1;
              try {
                const stderrData = JSON.parse(error.stderr);
                if (typeof stderrData.tabWidth === 'number') tabWidth = stderrData.tabWidth;
              } catch { /* use default */ }
              return { vscodeOptions: { tabWidth }, result: parsed };
            }
          } catch { /* not JSON — fall through to throw */ }
        }
        throw error;
      }

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

      let parsed;
      try {
        parsed = JSON.parse(result.stdout);
      } catch {
        throw new Error(`phpcs returned non-JSON output: ${result.stdout}`);
      }

      return {
        vscodeOptions: { tabWidth },
        result: parsed,
      };
    },
  };
};
module.exports.createRunner = createRunner;
