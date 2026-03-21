/**
 * @file
 * Contains the Formatter class.
 */

const {
  languages,
  Position,
  ProgressLocation,
  Range,
  TextEdit,
  window,
  workspace,
} = require('vscode');
const { processSnippet } = require('./strings');
const { createRunner } = require('./runner');
const { getExtraFileSelectors } = require('./files');
const { log } = require('./logger');
const { isIgnoredByPhpcs } = require('./phpcs-ignore');

/**
 * Gets a full range of a document.
 *
 * @param {import('vscode').TextDocument} document
 *   The document to get the full range of.
 *
 * @return {import('vscode').Range}
 *   The range that covers the whole document.
 */
const documentFullRange = (document) =>
  new Range(
    new Position(0, 0),
    document.lineAt(document.lineCount - 1).range.end,
  );

/**
 * Tests whether a range is for the full document.
 *
 * @param {import('vscode').Range} range
 *   The range to test.
 * @param {import('vscode').TextDocument} document
 *   The document to test with.
 *
 * @return {boolean}
 *   `true` if the given `range` is the full `document`.
 */
const isFullDocumentRange = (range, document) =>
  range.isEqual(documentFullRange(document));

/**
 * Runs phpcbf on a document range, logging any errors to the channel.
 *
 * @param {import('vscode').OutputChannel} channel
 * @param {import('vscode').TextDocument} document
 * @param {import('vscode').Range} range
 * @param {import('vscode').FormattingOptions} formatOptions
 * @param {import('vscode').CancellationToken} token
 *
 * @return {Promise<import('vscode').TextEdit[]>}
 */
const runPhpcbf = async (channel, document, range, formatOptions, token) => {
  if (isIgnoredByPhpcs(document.uri.fsPath)) return [];

  const isFullDocument = isFullDocumentRange(range, document);
  const text = document.getText(range);
  const formatter = createRunner(token, document.uri, isFullDocument, channel).phpcbf;

  try {
    const replacement = await window.withProgress(
      { location: ProgressLocation.Window, title: 'PHP Sniffer: formatting…' },
      () =>
        isFullDocument
          ? formatter(text)
          : processSnippet(text, formatOptions, formatter),
    );
    return replacement ? [new TextEdit(range, replacement)] : [];
  } catch (error) {
    const msg = /** @type {Error} */ (error).message;
    log(channel, 'error', `phpcbf error: ${msg}`);
    window.showErrorMessage(`PHP Sniffer: ${msg}`);
    return [];
  }
};

/**
 * Creates Formatter and PhpDocumentFormatter providers bound to a channel.
 *
 * @param {import('vscode').OutputChannel} channel
 *   The output channel for error logging.
 *
 * @return {{ Formatter: import('vscode').DocumentRangeFormattingEditProvider, PhpDocumentFormatter: import('vscode').DocumentFormattingEditProvider }}
 */
module.exports.createFormatter = (channel) => {
  /** @type {import('vscode').DocumentRangeFormattingEditProvider} */
  const Formatter = {
    provideDocumentRangeFormattingEdits(document, range, formatOptions, token) {
      return runPhpcbf(channel, document, range, formatOptions, token);
    },
  };

  /** @type {import('vscode').DocumentFormattingEditProvider} */
  const PhpDocumentFormatter = {
    provideDocumentFormattingEdits(document, formatOptions, token) {
      return Formatter.provideDocumentRangeFormattingEdits(
        document,
        documentFullRange(document),
        formatOptions,
        token,
      );
    },
  };

  return { Formatter, PhpDocumentFormatter };
};

/**
 * Formatter provider for any file type.
 *
 * @param {import('vscode').OutputChannel} channel
 *   The output channel for error logging.
 *
 * @return {import('vscode').Disposable}
 */
module.exports.activateGenericFormatter = (channel) => {
  /** @type {import('vscode').DocumentFormattingEditProvider} */
  const GenericFormatter = {
    provideDocumentFormattingEdits(document, formatOptions, token) {
      return runPhpcbf(
        channel,
        document,
        documentFullRange(document),
        formatOptions,
        token,
      );
    },
  };

  const registerGenericFormatter = () =>
    languages.registerDocumentFormattingEditProvider(
      getExtraFileSelectors(),
      GenericFormatter,
    );

  let formatter = registerGenericFormatter();

  const onConfigChange = workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('phpSniffer.extraFiles')) {
      formatter.dispose();
      formatter = registerGenericFormatter();
    }
  });

  return {
    dispose() {
      onConfigChange.dispose();
      formatter.dispose();
    },
  };
};
