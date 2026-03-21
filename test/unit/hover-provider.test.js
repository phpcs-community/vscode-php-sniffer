/**
 * @file
 * Unit tests for the hover provider.
 */

const { strictEqual, ok } = require('assert');
const { createHoverProvider } = require('../../lib/hover-provider');

/** Minimal MarkdownString stub. */
class MarkdownString {
  constructor() {
    this.value = '';
  }

  appendMarkdown(text) {
    this.value += text;
    return this;
  }
}

/** Minimal Hover stub. */
class Hover {
  constructor(contents) {
    this.contents = contents;
  }
}

/** Build a fake position with a contains check. */
function makePosition(line, character) {
  return { line, character };
}

/** Build a fake range. */
function makeRange(contains) {
  return { contains };
}

/** Build a fake diagnostic. */
function makeDiagnostic({ source, code, message, rangeContains }) {
  return {
    source,
    code,
    message,
    range: makeRange(rangeContains),
  };
}

/** Build a fake document with a given URI. */
function makeDocument(uri) {
  return { uri };
}

const deps = { Hover, MarkdownString };
const position = makePosition(0, 5);

suite('createHoverProvider()', function () {
  suite('provideHover()', function () {
    test('Returns undefined when diagnostics.get() returns undefined', function () {
      const diagnostics = { get: () => undefined };
      const provider = createHoverProvider(diagnostics, deps);

      const result = provider.provideHover(makeDocument('file:///test.php'), position);

      strictEqual(result, undefined);
    });

    test('Returns undefined when no PHPCS diagnostics overlap the position', function () {
      const diagnostics = {
        get: () => [
          makeDiagnostic({ source: 'PHPCS', code: 'PSR2.Test', message: 'Violation', rangeContains: () => false }),
        ],
      };
      const provider = createHoverProvider(diagnostics, deps);

      const result = provider.provideHover(makeDocument('file:///test.php'), position);

      strictEqual(result, undefined);
    });

    test('Returns undefined when diagnostic source is not PHPCS', function () {
      const diagnostics = {
        get: () => [
          makeDiagnostic({ source: 'eslint', code: 'some-rule', message: 'Violation', rangeContains: () => true }),
        ],
      };
      const provider = createHoverProvider(diagnostics, deps);

      const result = provider.provideHover(makeDocument('file:///test.php'), position);

      strictEqual(result, undefined);
    });

    test('Returns Hover with rule name when PHPCS diagnostic is at position', function () {
      const diagnostics = {
        get: () => [
          makeDiagnostic({ source: 'PHPCS', code: 'PSR2.ControlStructures.SwitchDeclaration.SpaceBeforeColon', message: 'Spacing issue', rangeContains: () => true }),
        ],
      };
      const provider = createHoverProvider(diagnostics, deps);

      const result = provider.provideHover(makeDocument('file:///test.php'), position);

      ok(result instanceof Hover);
      const content = result.contents[0].value;
      ok(content.includes('PSR2.ControlStructures.SwitchDeclaration.SpaceBeforeColon'), 'should include rule name');
      ok(content.includes('**Rule:**'), 'should label rule');
    });

    test('Includes fixable hint when message ends with [fixable]', function () {
      const diagnostics = {
        get: () => [
          makeDiagnostic({ source: 'PHPCS', code: 'Generic.Formatting.SpaceAfterCast', message: 'Expected 1 space after cast [fixable]', rangeContains: () => true }),
        ],
      };
      const provider = createHoverProvider(diagnostics, deps);

      const result = provider.provideHover(makeDocument('file:///test.php'), position);

      ok(result instanceof Hover);
      const content = result.contents[0].value;
      ok(content.includes('auto-fixed with PHPCBF'), 'should include fixable hint');
    });

    test('Does not include fixable hint when message does not end with [fixable]', function () {
      const diagnostics = {
        get: () => [
          makeDiagnostic({ source: 'PHPCS', code: 'PSR2.Test', message: 'Non-fixable violation', rangeContains: () => true }),
        ],
      };
      const provider = createHoverProvider(diagnostics, deps);

      const result = provider.provideHover(makeDocument('file:///test.php'), position);

      const content = result.contents[0].value;
      strictEqual(content.includes('auto-fixed with PHPCBF'), false, 'should not include fixable hint');
    });

    test('Includes PHPCS docs link in markdown', function () {
      const diagnostics = {
        get: () => [
          makeDiagnostic({ source: 'PHPCS', code: 'PSR2.Test', message: 'Violation', rangeContains: () => true }),
        ],
      };
      const provider = createHoverProvider(diagnostics, deps);

      const result = provider.provideHover(makeDocument('file:///test.php'), position);

      const content = result.contents[0].value;
      ok(content.includes('https://github.com/squizlabs/PHP_CodeSniffer/wiki'), 'should include docs link');
    });

    test('Shows all overlapping diagnostics when multiple PHPCS diagnostics overlap the position', function () {
      const diagnostics = {
        get: () => [
          makeDiagnostic({ source: 'PHPCS', code: 'Rule.One', message: 'First violation', rangeContains: () => true }),
          makeDiagnostic({ source: 'PHPCS', code: 'Rule.Two', message: 'Second violation [fixable]', rangeContains: () => true }),
        ],
      };
      const provider = createHoverProvider(diagnostics, deps);

      const result = provider.provideHover(makeDocument('file:///test.php'), position);

      ok(result instanceof Hover);
      const content = result.contents[0].value;
      ok(content.includes('Rule.One'), 'should include first rule');
      ok(content.includes('Rule.Two'), 'should include second rule');
      ok(content.includes('---'), 'should separate diagnostics with a horizontal rule');
      ok(content.includes('auto-fixed with PHPCBF'), 'should include fixable hint for second');
    });
  });
});
