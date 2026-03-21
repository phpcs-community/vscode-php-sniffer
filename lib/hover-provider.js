/**
 * @file
 * Hover provider for PHP CodeSniffer diagnostics.
 */

/** @type {Record<string, string>} Maps known standard prefixes to their documentation URLs. */
const STANDARD_DOCS_URLS = {
  SlevomatCodingStandard: 'https://github.com/slevomat/coding-standard',
  WordPress: 'https://github.com/WordPress/WordPress-Coding-Standards',
  'WordPress-Core': 'https://github.com/WordPress/WordPress-Coding-Standards',
  'WordPress-Extra': 'https://github.com/WordPress/WordPress-Coding-Standards',
  'WordPress-VIP': 'https://github.com/WordPress/WordPress-Coding-Standards',
  PHPCompatibility: 'https://github.com/PHPCompatibility/PHPCompatibility',
  NeutronStandard: 'https://github.com/Automattic/phpcs-neutron-standard',
  Doctrine: 'https://github.com/doctrine/coding-standard',
  Symfony: 'https://github.com/djoos/Symfony-coding-standard',
  // Built-in PHPCS standards → wiki
  Generic: 'https://github.com/PHPCSStandards/PHP_CodeSniffer/wiki',
  PSR1: 'https://github.com/PHPCSStandards/PHP_CodeSniffer/wiki',
  PSR2: 'https://github.com/PHPCSStandards/PHP_CodeSniffer/wiki',
  PSR12: 'https://github.com/PHPCSStandards/PHP_CodeSniffer/wiki',
  Squiz: 'https://github.com/PHPCSStandards/PHP_CodeSniffer/wiki',
  PEAR: 'https://github.com/PHPCSStandards/PHP_CodeSniffer/wiki',
  MySource: 'https://github.com/PHPCSStandards/PHP_CodeSniffer/wiki',
  Zend: 'https://github.com/PHPCSStandards/PHP_CodeSniffer/wiki',
};

/**
 * Returns the documentation URL for a given PHPCS rule code.
 *
 * @param {string | undefined} ruleCode  The full sniff name, e.g. `SlevomatCodingStandard.Namespaces.Foo`.
 * @return {string | undefined}  The documentation URL, or undefined if unknown.
 */
function getDocsUrl(ruleCode) {
  if (!ruleCode) return undefined;
  const standard = ruleCode.split('.')[0];
  return STANDARD_DOCS_URLS[standard];
}

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
          md.appendMarkdown(
            '\n\n*This violation can be auto-fixed with PHPCBF.*',
          );
        }
        const docsUrl = getDocsUrl(d.code);
        if (docsUrl) {
          md.appendMarkdown(`\n\n[View documentation](${docsUrl})`);
        }
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
