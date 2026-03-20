/**
 * @file
 * Extension commands.
 */

const {
  commands,
  languages,
  window,
  workspace,
  CancellationTokenSource,
  WorkspaceEdit,
  Range,
  Position,
} = require('vscode');
const { createRunner } = require('./runner');
const { reportFlatten } = require('./phpcs-report');
const { log } = require('./logger');

/**
 * Registers all extension commands.
 *
 * @param {import('vscode').OutputChannel} channel
 *   The shared output channel.
 *
 * @return {import('vscode').Disposable}
 *   A single disposable that cleans up all commands and the diagnostics collection.
 */
function registerCommands(channel) {
  const diagnostics = languages.createDiagnosticCollection('phpcs-commands');

  const disposables = [
    diagnostics,

    commands.registerCommand('phpSniffer.showOutput', () => {
      channel.show(true);
    }),

    commands.registerCommand('phpSniffer.runLint', async () => {
      const doc = window.activeTextEditor?.document;
      if (!doc) return;
      const cts = new CancellationTokenSource();
      const runner = createRunner(cts.token, doc.uri);
      try {
        const result = await runner.phpcs(doc.getText());
        if (result) {
          diagnostics.set(doc.uri, reportFlatten(result, doc.getText()));
        }
      } catch (error) {
        log(channel, 'error', `phpcs error: ${error.message}`);
        window.showErrorMessage(error.message);
      } finally {
        cts.dispose();
      }
    }),

    commands.registerCommand('phpSniffer.fixFile', async () => {
      const editor = window.activeTextEditor;
      if (!editor) return;
      const doc = editor.document;
      const cts = new CancellationTokenSource();
      const runner = createRunner(cts.token, doc.uri);
      try {
        const fixed = await runner.phpcbf(doc.getText());
        if (fixed !== doc.getText()) {
          const edit = new WorkspaceEdit();
          const fullRange = new Range(
            new Position(0, 0),
            doc.lineAt(doc.lineCount - 1).range.end,
          );
          edit.replace(doc.uri, fullRange, fixed);
          await workspace.applyEdit(edit);
        }
      } catch (error) {
        log(channel, 'error', `phpcbf error: ${error.message}`);
        window.showErrorMessage(error.message);
      } finally {
        cts.dispose();
      }
    }),
  ];

  return {
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}

module.exports = { registerCommands };
