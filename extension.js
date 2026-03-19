/**
 * @file
 * Extension entry.
 */

const { languages } = require('vscode');
const { activateGenericFormatter, Formatter, PhpDocumentFormatter } = require('./lib/formatter');
const { createValidator } = require('./lib/validator');

module.exports = {
  /**
   * Activates the extension.
   *
   * @param {import('vscode').ExtensionContext} context
   *   A collection of utilities private to the extension.
   */
  activate(context) {
    context.subscriptions.push(
      languages.registerDocumentFormattingEditProvider({ language: 'php', scheme: 'file' }, PhpDocumentFormatter),
      languages.registerDocumentRangeFormattingEditProvider({ language: 'php', scheme: 'file' }, Formatter),
      activateGenericFormatter(),
      createValidator(),
    );
  },
};
