/**
 * @file
 * Extension entry.
 */

const {
  extensions,
  languages,
  window,
  workspace,
  CodeActionKind,
  CancellationTokenSource,
  TextEdit,
  Range,
  Position,
} = require('vscode');
const {
  createFormatter,
  activateGenericFormatter,
} = require('./lib/formatter');
const { createValidator } = require('./lib/validator');
const { registerCommands, setPhpcsVersion } = require('./lib/commands');
const { createCodeActionProvider } = require('./lib/code-actions');
const { createHoverProvider } = require('./lib/hover-provider');
const {
  findNearestConfig,
  resolveExecutableFolderCached,
  detectPhpcsVersion,
} = require('./lib/resolver');
const { parseMajorVersion } = require('./lib/version');
const { log } = require('./lib/logger');
const { createRunner } = require('./lib/runner');
const {
  clearIgnoreCache,
  markExcludedByConfig,
} = require('./lib/phpcs-ignore');

module.exports = {
  /**
   * Activates the extension.
   *
   * @param {import('vscode').ExtensionContext} context
   *   A collection of utilities private to an extension.
   */
  activate(context) {
    const channel = window.createOutputChannel('PHP CodeSniffer');

    const { Formatter, PhpDocumentFormatter } = createFormatter(channel);

    // Extensions that only conflict as a formatter (different tool, no phpcs linting).
    const FORMATTER_CONFLICTS = [
      { id: 'junstyle.php-cs-fixer', name: 'PHP CS Fixer' },
      { id: 'nickmitchko.php-fixer-formatter', name: 'PHP Fixer Formatter' },
      {
        id: 'persoderlind.vscode-phpcbf',
        name: 'PHP Code Beautifier (phpcbf)',
      },
    ];

    // Extensions that run both phpcs linting AND phpcbf formatting — full conflict.
    const FULL_CONFLICTS = [
      { id: 'wongjn.php-sniffer', name: 'PHP Sniffer (wongjn)' },
      { id: 'ValeryanM.vscode-phpsab', name: 'PHP Sniffer & Beautifier' },
    ];

    // Extensions that only run phpcs linting — duplicate diagnostics.
    const LINTER_CONFLICTS = [
      { id: 'ikappas.phpcs', name: 'PHP CodeSniffer (ikappas)' },
      { id: 'shevaua.phpcs', name: 'PHP CodeSniffer (shevaua)' },
    ];

    const activeFormatterConflicts = FORMATTER_CONFLICTS.filter(
      (e) => extensions.getExtension(e.id) !== undefined,
    );
    const activeFullConflicts = FULL_CONFLICTS.filter(
      (e) => extensions.getExtension(e.id) !== undefined,
    );
    const activeLinterConflicts = LINTER_CONFLICTS.filter(
      (e) => extensions.getExtension(e.id) !== undefined,
    );

    const hasConflict =
      activeFormatterConflicts.length > 0 || activeFullConflicts.length > 0;

    if (activeFormatterConflicts.length > 0) {
      const names = activeFormatterConflicts.map((e) => e.name).join(', ');
      log(
        channel,
        'info',
        `Skipping formatter registration: conflicting PHP formatter extension detected (${names})`,
      );
      window.showWarningMessage(
        `PHP Sniffer: Formatter conflict — ${names} is also active. Formatter registration skipped to avoid conflicts.`,
      );
    }

    if (activeFullConflicts.length > 0) {
      const names = activeFullConflicts.map((e) => e.name).join(', ');
      log(
        channel,
        'info',
        `Skipping formatter registration: conflicting PHPCS extension detected (${names})`,
      );
      window.showWarningMessage(
        `PHP Sniffer: Conflicting PHPCS extension detected — ${names} is also active and provides both linting and formatting. Disable one to avoid duplicate diagnostics and formatter conflicts.`,
      );
    }

    if (activeLinterConflicts.length > 0) {
      const names = activeLinterConflicts.map((e) => e.name).join(', ');
      log(
        channel,
        'info',
        `Conflicting PHPCS linter extension detected (${names})`,
      );
      window.showWarningMessage(
        `PHP Sniffer: Conflicting PHPCS extension detected — ${names} is also active. Disable one to avoid duplicate diagnostics.`,
      );
    }

    const validator = createValidator(channel);

    context.subscriptions.push(
      channel,
      workspace.onWillSaveTextDocument((event) => {
        const { document } = event;
        if (document.languageId !== 'php' || document.uri.scheme !== 'file')
          return;
        if (
          !workspace
            .getConfiguration('phpSniffer', document.uri)
            .get('fixOnSave', false)
        )
          return;

        const cts = new CancellationTokenSource();
        const cancelTimer = setTimeout(() => cts.cancel(), 1200);
        const runner = createRunner(cts.token, document.uri, true, channel);
        const original = document.getText();

        event.waitUntil(
          runner
            .phpcbf(original)
            .then((fixedText) => {
              if (fixedText == null || fixedText === original) return [];
              const lastLine = document.lineAt(document.lineCount - 1);
              const fullRange = new Range(
                new Position(0, 0),
                lastLine.range.end,
              );
              return [TextEdit.replace(fullRange, fixedText)];
            })
            .catch((err) => {
              if (
                // v4
                (err.stderr || err.message || '').includes(
                  'No files were checked',
                ) ||
                // v3
                (err.message || '').includes('No violations were found')
              ) {
                markExcludedByConfig(document.uri.fsPath);
                log(
                  channel,
                  'debug',
                  `phpcbf skipped (excluded by config): ${document.uri.fsPath}`,
                );
              } else {
                log(channel, 'error', `Fix on save failed: ${err.message}`);
              }
              return [];
            })
            .finally(() => {
              clearTimeout(cancelTimer);
              cts.dispose();
            }),
        );
      }),
      ...(hasConflict
        ? []
        : [
            languages.registerDocumentFormattingEditProvider(
              { language: 'php', scheme: 'file' },
              PhpDocumentFormatter,
            ),
          ]),
      languages.registerDocumentRangeFormattingEditProvider(
        { language: 'php', scheme: 'file' },
        Formatter,
      ),
      activateGenericFormatter(channel),
      registerCommands(channel, validator.diagnostics),
      languages.registerCodeActionsProvider(
        { language: 'php', scheme: 'file' },
        createCodeActionProvider(),
        { providedCodeActionKinds: [CodeActionKind.QuickFix] },
      ),
      validator,
      languages.registerHoverProvider(
        { language: 'php', scheme: 'file' },
        createHoverProvider(validator.diagnostics),
      ),
    );

    const ignoreWatcher = workspace.createFileSystemWatcher('**/.phpcsignore');
    context.subscriptions.push(
      ignoreWatcher,
      ignoreWatcher.onDidChange(() => clearIgnoreCache()),
      ignoreWatcher.onDidCreate(() => clearIgnoreCache()),
      ignoreWatcher.onDidDelete(() => clearIgnoreCache()),
    );

    // Detect and log PHPCS version at activation.
    // Version detection uses the first workspace folder's phpcs executable.
    // Per-file workspace folder lookup is handled by createRunner at lint time.
    const firstFolder = workspace.workspaceFolders?.[0];
    const firstConfig = firstFolder
      ? workspace.getConfiguration('phpSniffer', firstFolder.uri)
      : workspace.getConfiguration('phpSniffer');
    resolveExecutableFolderCached(firstConfig, firstFolder)
      .then((folder) => detectPhpcsVersion(folder))
      .then((version) => {
        setPhpcsVersion(version);
        if (version) {
          log(channel, 'info', `PHP CodeSniffer version ${version} detected`);
          const major = parseMajorVersion(version);
          if (major >= 4) {
            log(channel, 'info', 'PHP CodeSniffer v4 detected.');
          } else if (major === 3) {
            log(channel, 'info', 'PHP CodeSniffer v3 detected.');
          }
        }
      })
      .catch(() => {});

    // Detect PHPCS config and show one-time info message
    const notifiedKey = 'phpSniffer.configDetectedNotified';
    const folders = workspace.workspaceFolders;
    if (
      folders &&
      folders.length > 0 &&
      !context.globalState.get(notifiedKey)
    ) {
      // Onboarding check uses first workspace folder only (one-time notification).
      findNearestConfig(folders[0].uri.fsPath)
        .then((configPath) => {
          if (configPath) {
            context.globalState.update(notifiedKey, true);
            window.showInformationMessage(
              `PHP CodeSniffer: Config detected at ${configPath}. Using project ruleset.`,
            );
          }
        })
        .catch(() => {
          // Non-critical onboarding check — ignore errors silently
        });
    }
  },
};
