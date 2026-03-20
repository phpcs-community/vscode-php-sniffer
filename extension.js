/**
 * @file
 * Extension entry.
 */

const { languages, window, workspace } = require('vscode');
const {
  createFormatter,
  activateGenericFormatter,
} = require('./lib/formatter');
const { createValidator } = require('./lib/validator');
const { registerCommands } = require('./lib/commands');
const { findNearestConfig } = require('./lib/resolver');

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

    context.subscriptions.push(
      channel,
      languages.registerDocumentFormattingEditProvider(
        { language: 'php', scheme: 'file' },
        PhpDocumentFormatter,
      ),
      languages.registerDocumentRangeFormattingEditProvider(
        { language: 'php', scheme: 'file' },
        Formatter,
      ),
      activateGenericFormatter(channel),
      createValidator(channel),
      registerCommands(channel),
    );

    // Detect PHPCS config and show one-time info message
    const notifiedKey = 'phpSniffer.configDetectedNotified';
    const folders = workspace.workspaceFolders;
    if (folders && folders.length > 0 && !context.globalState.get(notifiedKey)) {
      // Check first workspace folder for a config
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
