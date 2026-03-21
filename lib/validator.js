/**
 * @file
 * Contains the validator class.
 */

const debounce = require('lodash.debounce');
const {
  languages,
  window,
  workspace,
  CancellationTokenSource,
  debug,
} = require('vscode');
const { reportFlatten } = require('./phpcs-report');
const { createRunner } = require('./runner');
const { createTokenManager } = require('./tokens');
const { getExtraFileSelectors } = require('./files');
const { log } = require('./logger');
const { createQueue } = require('./queue');
const { clearCache } = require('./resolver');
const { createStatusBar } = require('./status-bar');

/**
 * @typedef {import('vscode').Diagnostic} Diagnostic
 */

/**
 * Validator runtime object.
 *
 * @typedef {object} ValidatorRuntime
 *
 * @property {() => void} dispose
 *   Dispose the current validator listener.
 * @property {function(typeof import('vscode').workspace): void} setFromConfig
 *   VSCode editor workspace namespace API.
 * @property {function(import('vscode').TextDocument): void} validate
 *   Validates a text document.
 */

/**
 * Resets validator for new settings.
 *
 * @param {import('vscode').DiagnosticCollection} diagnostics
 *   Diagnostic collection.
 * @param {import('./tokens').TokenManager} tokenManager
 *   Token manager.
 * @param {ValidatorRuntime} validatorRuntime
 *   Text document validator runtime manager.
 */
function reset(diagnostics, tokenManager, validatorRuntime) {
  clearCache();
  diagnostics.clear();
  tokenManager.clearTokens();
  validatorRuntime.dispose();

  if (workspace.getConfiguration('phpSniffer').get('run') !== 'never') {
    validatorRuntime.setFromConfig(workspace);
    workspace.textDocuments.forEach(validatorRuntime.validate);
  }
}

/**
 * Constructs a validator runtime object.
 *
 * @param {function(import('vscode').TextDocument): void} validate
 *   Text document validator.
 *
 * @return {ValidatorRuntime}
 *   The validator runtime.
 */
const createValidatorRuntime = (validate) => ({
  dispose() {},
  setFromConfig() {
    const config = workspace.getConfiguration('phpSniffer');

    const disposable =
      config.get('run', 'onSave') === 'onSave'
        ? workspace.onDidSaveTextDocument(validate)
        : workspace.onDidChangeTextDocument(
            debounce(
              ({ document }) => {
                validate(document);
              },
              config.get('onTypeDelay', 250),
            ),
          );
    this.dispose = disposable.dispose.bind(disposable);
  },
  validate,
});

/**
 * Calls the given callback if the passed even affects validator running.
 *
 * @param {Function} callback
 *   The callback to run.
 *
 * @return {function(import('vscode').ConfigurationChangeEvent): void}
 *   The function to attached to workspace.onDidChangeConfiguration().
 */
const isRunAffect = (callback) => (event) => {
  if (
    !event.affectsConfiguration('phpSniffer') ||
    !(
      event.affectsConfiguration('phpSniffer.run') ||
      event.affectsConfiguration('phpSniffer.onTypeDelay')
    )
  ) {
    return;
  }

  callback();
};

/**
 * Removes a text document from diagnostics and tokens.
 *
 * @param {import('vscode').DiagnosticCollection} diagnostics
 *   Diagnostic collection.
 * @param {import('./tokens').TokenManager} tokenManager
 *   Token manager.
 *
 * @return {function(import('vscode').TextDocument): void} document
 *   The text document.
 */
const onDocumentClose =
  (diagnostics, tokenManager) =>
  ({ uri }) => {
    diagnostics.delete(uri);
    tokenManager.discardToken(uri.fsPath);
  };

/**
 * Whether validation should run for the given document.
 *
 * @param {import('vscode').TextDocument} document
 *   The document to validate.
 *
 * @return {boolean}
 *   True if validation should run, false otherwise.
 */
const shouldValidate = (document) => {
  const config = workspace.getConfiguration('phpSniffer', document.uri);
  const maxFileSize = config.get('maxFileSize', 0);

  return (
    !document.isClosed &&
    (document.languageId === 'php' ||
      languages.match(getExtraFileSelectors(), document) > 0) &&
    (!config.get('disableWhenDebugging', false) || !debug.activeDebugSession) &&
    (maxFileSize === 0 || document.getText().length <= maxFileSize * 1024)
  );
};

/**
 * Lints a document.
 *
 * @param {import('vscode').DiagnosticCollection} diagnostics
 *   Diagnostic collection.
 * @param {import('./tokens').TokenManager} tokenManager
 *   Token manager.
 * @param {import('vscode').OutputChannel} channel
 *   Output channel.
 *
 * @return {function(import('vscode').TextDocument): void}
 *   The validator function.
 */
const validateDocument = (diagnostics, tokenManager, channel, queue, onDiagnosticsSet) => (document) => {
  if (!shouldValidate(document)) {
    return;
  }

  const token = tokenManager.registerToken(document.uri.fsPath);

  const text = document.getText();
  const resultPromise = queue.run(() => createRunner(token, document.uri, true, channel).phpcs(text));

  resultPromise
    .then((result) => {
      if (document.isClosed) {
        // Clear diagnostics on a closed document.
        diagnostics.delete(document.uri);
        onDiagnosticsSet(document.uri);
        // If the command was not cancelled.
      } else if (result !== null) {
        diagnostics.set(document.uri, reportFlatten(result, text));
        onDiagnosticsSet(document.uri);
      }
    })
    .catch((error) => {
      if (error.code === 'ENOENT') {
        const msg =
          'phpcs executable not found. Install phpcs or check `phpSniffer.executablesFolder`.';
        log(channel, 'error', msg);
        window.showErrorMessage(msg);
      } else {
        log(channel, 'error', `phpcs error: ${error.message}`);
        window.showErrorMessage(error.message);
      }

      // Reset diagnostics for the document if there was an error.
      diagnostics.delete(document.uri);
    });
};

/**
 * Conditionally runs a function depending on the `run` config setting.
 *
 * @template {Function} T
 *
 * @param {T} fn
 *   The function to maybe run.
 * @return {T|(() => void)}
 *   The function to invoke.
 */
const maybeRun =
  (fn) =>
  (...args) =>
    workspace.getConfiguration('phpSniffer').get('run') === 'never'
      ? () => {}
      : fn(...args);

/**
 * The validator.
 *
 * @param {import('vscode').OutputChannel} channel
 *   Output channel for logging.
 *
 * @return {import('vscode').Disposable}
 *   The disposable to dispose the validator.
 */
module.exports.createValidator = (channel) => {
  const diagnostics = languages.createDiagnosticCollection('php');
  const tokenManager = createTokenManager(() => new CancellationTokenSource());
  const limit = workspace.getConfiguration('phpSniffer').get('maxConcurrentProcesses', 4);
  const queue = createQueue(limit);

  const statusBar = createStatusBar(diagnostics);
  const validate = validateDocument(diagnostics, tokenManager, channel, queue, statusBar.update);
  const validatorRuntime = createValidatorRuntime(validate);
  const resetMe = reset.bind(null, diagnostics, tokenManager, validatorRuntime);

  const workspaceListeners = [
    workspace.onDidChangeConfiguration(isRunAffect(resetMe)),
    workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration('phpSniffer.executablesFolder') ||
        event.affectsConfiguration('phpSniffer.autoDetect')
      ) {
        clearCache();
      }
    }),
    workspace.onDidOpenTextDocument(maybeRun(validate)),
    workspace.onDidCloseTextDocument(
      onDocumentClose(diagnostics, tokenManager),
    ),
    workspace.onDidChangeWorkspaceFolders(resetMe),
  ];

  resetMe();

  return {
    diagnostics,
    dispose() {
      diagnostics.clear();
      diagnostics.dispose();
      validatorRuntime.dispose();
      tokenManager.clearTokens();
      workspaceListeners.forEach((listener) => listener.dispose());
      statusBar.dispose();
    },
  };
};
