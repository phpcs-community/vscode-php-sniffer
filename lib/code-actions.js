/**
 * @file
 * Code action provider for PHP CodeSniffer diagnostics.
 */

/**
 * Creates a CodeActionProvider that offers "Fix with PHPCBF" on fixable diagnostics.
 *
 * A diagnostic is considered fixable when its message ends with ` [fixable]`
 * and its source is `'PHPCS'`.
 *
 * @param {{ CodeAction: Function, CodeActionKind: object }} [deps]
 *   Optional vscode API objects (used for dependency injection in tests).
 *   Defaults to the real `vscode` module when omitted.
 *
 * @return {import('vscode').CodeActionProvider}
 *   The provider.
 */
function createCodeActionProvider(deps) {
  // eslint-disable-next-line global-require
  const { CodeAction: CA, CodeActionKind: CAK } = deps || require('vscode');
  return {
    /**
     * @param {import('vscode').TextDocument} _document
     * @param {import('vscode').Range} _range
     * @param {import('vscode').CodeActionContext} context
     * @return {import('vscode').CodeAction[]}
     */
    provideCodeActions(_document, _range, context) {
      const fixableDiagnostics = context.diagnostics.filter(
        (d) => d.source === 'PHPCS' && d.message.endsWith(' [fixable]'),
      );

      if (fixableDiagnostics.length === 0) {
        return [];
      }

      const action = new CA('Fix with PHPCBF', CAK.QuickFix);
      action.command = {
        command: 'phpSniffer.fixFile',
        title: 'Fix with PHPCBF',
      };
      action.isPreferred = false;
      action.diagnostics = fixableDiagnostics;

      return [action];
    },
  };
}

module.exports = { createCodeActionProvider };
