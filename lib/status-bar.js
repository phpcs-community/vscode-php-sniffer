/**
 * @file
 * Status bar item for PHPCS diagnostics.
 */

const { window, StatusBarAlignment } = require('vscode');

/**
 * Creates and manages the PHPCS status bar item.
 *
 * @param {import('vscode').DiagnosticCollection} diagnostics
 *   The diagnostic collection to read from.
 *
 * @return {{ update: function(import('vscode').Uri|undefined): void, dispose: function(): void }}
 */
function createStatusBar(diagnostics) {
  const item = window.createStatusBarItem(
    // Right side, priority 0 (lower = further right)
    StatusBarAlignment.Right,
    0,
  );
  item.command = 'phpSniffer.showOutput';
  item.tooltip = 'PHP CodeSniffer — click to show output';

  function update(uri) {
    if (!uri) {
      item.hide();
      return;
    }

    const diags = diagnostics.get(uri) || [];
    const errors = diags.filter((d) => d.severity === 0).length;   // DiagnosticSeverity.Error = 0
    const warnings = diags.filter((d) => d.severity === 1).length; // DiagnosticSeverity.Warning = 1

    if (errors > 0 || warnings > 0) {
      item.text = `$(error) PHPCS: ${errors}E ${warnings}W`;
    } else {
      item.text = `$(check) PHPCS`;
    }
    item.show();
  }

  // Listen for active editor changes
  const editorListener = window.onDidChangeActiveTextEditor((editor) => {
    update(editor?.document.uri);
  });

  // Update immediately for current editor
  update(window.activeTextEditor?.document.uri);

  return {
    update,
    dispose() {
      editorListener.dispose();
      item.dispose();
    },
  };
}

module.exports = { createStatusBar };
