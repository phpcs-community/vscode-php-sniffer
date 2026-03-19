/**
 * @file
 * Extension entry.
 */

const { languages, window } = require('vscode');
const {
  createFormatter,
  activateGenericFormatter,
} = require('./lib/formatter');
const { createValidator } = require('./lib/validator');

module.exports = {
  /**
   * Activates the extension.
   *
   * @param {import('vscode').ExtensionContext} context
   *   A collection of utilities private to an extension.
   */
  activate(context) {
    const channel = window.createOutputChannel('PHP Sniffer');

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
      activateGenericFormatter(),
      createValidator(channel),
    );
  },
};
