/**
 * @file
 * Hover provider for PHP CodeSniffer diagnostics.
 */

/**
 * Creates a HoverProvider that shows PHPCS rule info when hovering over a diagnostic.
 *
 * @param {import('vscode').DiagnosticCollection} diagnostics
 *   The diagnostic collection to query.
 * @param {{ Hover: Function, MarkdownString: Function }} [deps]
 *   Optional vscode API objects (used for dependency injection in tests).
 *   Defaults to the real `vscode` module when omitted.
 *
 * @return {import('vscode').HoverProvider}
 *   The provider.
 */
function createHoverProvider(diagnostics, deps) {
  // eslint-disable-next-line global-require
  const { Hover: H, MarkdownString: MS } = deps || require('vscode');

  return {
    /**
     * @param {import('vscode').TextDocument} document
     * @param {import('vscode').Position} position
     * @return {import('vscode').Hover | undefined}
     */
    provideHover(document, position) {
      const fileDiagnostics = diagnostics.get(document.uri);
      if (!fileDiagnostics) return undefined;

      const matching = fileDiagnostics.filter(
        (d) => d.source === 'PHPCS' && d.range.contains(position),
      );

      if (matching.length === 0) return undefined;

      const parts = matching.map((d) => {
        const md = new MS();
        md.appendMarkdown(`**Rule:** \`${d.code}\``);
        if (d.message.endsWith(' [fixable]')) {
          md.appendMarkdown('\n\n*This violation can be auto-fixed with PHPCBF.*');
        }
        md.appendMarkdown('\n\n[View PHPCS documentation](https://github.com/squizlabs/PHP_CodeSniffer/wiki)');
        return md;
      });

      // Join multiple diagnostics with a separator by building one combined MarkdownString
      if (parts.length === 1) {
        return new H([parts[0]]);
      }

      const combined = new MS();
      parts.forEach((part, i) => {
        if (i > 0) combined.appendMarkdown('\n\n---\n\n');
        combined.appendMarkdown(part.value);
      });

      return new H([combined]);
    },
  };
}

module.exports = { createHoverProvider };
