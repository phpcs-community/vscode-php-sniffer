/**
 * @file
 * Extension commands.
 */

const {
  commands,
  env,
  window,
  workspace,
  CancellationTokenSource,
  Uri,
  WorkspaceEdit,
  Range,
  Position,
} = require('vscode');
const { tmpdir } = require('os');
const { writeFile, unlink } = require('fs/promises');
const path = require('path');
const { createRunner } = require('./runner');
const { reportFlatten } = require('./phpcs-report');
const { log } = require('./logger');

/** @type {string|null} */
let _phpcsVersion = null;

/**
 * Sets the detected phpcs version for use in debug info.
 *
 * @param {string|null} version
 */
function setPhpcsVersion(version) {
  _phpcsVersion = version;
}

/**
 * Registers all extension commands.
 *
 * @param {import('vscode').OutputChannel} channel
 *   The shared output channel.
 * @param {import('vscode').DiagnosticCollection} diagnostics
 *   The validator's diagnostic collection (shared to avoid duplicate diagnostics).
 *
 * @return {import('vscode').Disposable}
 *   A single disposable that cleans up all commands.
 */
function registerCommands(channel, diagnostics) {
  const disposables = [

    commands.registerCommand('phpSniffer.showOutput', () => {
      channel.show(true);
    }),

    commands.registerCommand('phpSniffer.runLint', async () => {
      const doc = window.activeTextEditor?.document;
      if (!doc) return;
      const cts = new CancellationTokenSource();
      const runner = createRunner(cts.token, doc.uri, true, channel);
      try {
        const text = doc.getText();
        const result = await runner.phpcs(text);
        if (result && !doc.isClosed) {
          diagnostics.set(doc.uri, reportFlatten(result, text));
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
      const runner = createRunner(cts.token, doc.uri, true, channel);
      try {
        const original = doc.getText();
        const fixed = await runner.phpcbf(original);
        if (fixed != null && fixed !== original) {
          const previewFix = workspace.getConfiguration('phpSniffer').get('previewFix', false);
          if (previewFix) {
            const tmpPath = path.join(tmpdir(), `phpcs-fix-preview-${Date.now()}.php`);
            await writeFile(tmpPath, fixed);
            const tmpUri = Uri.file(tmpPath);
            await commands.executeCommand(
              'vscode.diff',
              doc.uri,
              tmpUri,
              `PHPCBF Fix Preview ← ${path.basename(doc.fileName)}`,
            );
            // Note: cleanup fires when the diff tab's document is closed. If the tab is abandoned
            // without being explicitly closed, the temp file remains until the OS clears tmpdir.
            const cleanup = workspace.onDidCloseTextDocument((closedDoc) => {
              if (closedDoc.uri.fsPath === tmpPath) {
                cleanup.dispose();
                unlink(tmpPath).catch(() => {});
              }
            });
            return;
          }
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

    commands.registerCommand('phpSniffer.copyDebugInfo', async () => {
      const folders = workspace.workspaceFolders?.map(f => f.uri.fsPath).join(', ') || 'none';
      const config = workspace.getConfiguration('phpSniffer');
      const info = [
        `PHP CodeSniffer Extension Debug Info`,
        `=====================================`,
        `PHP CodeSniffer: ${_phpcsVersion || 'unknown'}`,
        `Workspace folders: ${folders}`,
        `phpSniffer.executablesFolder: ${config.get('executablesFolder', '') || '(not set)'}`,
        `phpSniffer.standard: ${config.get('standard', '') || '(not set)'}`,
        `phpSniffer.autoDetect: ${config.get('autoDetect', false)}`,
        `phpSniffer.run: ${config.get('run', 'onSave')}`,
        `phpSniffer.logLevel: ${config.get('logLevel', 'error')}`,
        `phpSniffer.timeout: ${config.get('timeout', 30)}s`,
        `phpSniffer.maxConcurrentProcesses: ${config.get('maxConcurrentProcesses', 4)}`,
        `phpSniffer.workingDirectory: ${config.get('workingDirectory', 'auto')}`,
      ].join('\n');
      await env.clipboard.writeText(info);
      window.showInformationMessage('PHP Sniffer: Debug info copied to clipboard.');
    }),
  ];

  return {
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}

module.exports = { registerCommands, setPhpcsVersion };
