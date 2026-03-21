/**
 * @file
 * Unit tests for the code action provider.
 */

const { strictEqual, deepStrictEqual } = require('assert');
const { createCodeActionProvider } = require('../../lib/code-actions');

/**
 * Minimal CodeActionKind stub.
 */
const CodeActionKind = {
  QuickFix: { value: 'quickfix' },
};

/**
 * Minimal CodeAction stub that records constructor args and allows property assignment.
 */
class CodeAction {
  constructor(title, kind) {
    this.title = title;
    this.kind = kind;
  }
}

/** Helper to create a fake diagnostic. */
function makeDiagnostic({ source, message }) {
  return { source, message };
}

suite('createCodeActionProvider()', function () {
  const provider = createCodeActionProvider({ CodeAction, CodeActionKind });

  suite('provideCodeActions()', function () {
    test('Returns a CodeAction when at least one fixable PHPCS diagnostic is present', function () {
      const fixable = makeDiagnostic({
        source: 'PHPCS',
        message: 'Some rule violation [fixable]',
      });
      const context = {
        diagnostics: [fixable],
      };

      const actions = provider.provideCodeActions(null, null, context);

      strictEqual(actions.length, 1);
      strictEqual(actions[0] instanceof CodeAction, true);
      strictEqual(actions[0].title, 'Fix all fixable violations (PHPCBF)');
      deepStrictEqual(actions[0].diagnostics, [fixable]);
    });

    test('Returns empty array when no diagnostics are fixable', function () {
      const context = {
        diagnostics: [
          makeDiagnostic({ source: 'PHPCS', message: 'Some rule violation' }),
        ],
      };

      const actions = provider.provideCodeActions(null, null, context);

      deepStrictEqual(actions, []);
    });

    test('Returns empty array when there are no diagnostics', function () {
      const context = { diagnostics: [] };

      const actions = provider.provideCodeActions(null, null, context);

      deepStrictEqual(actions, []);
    });

    test('Returns empty array when fixable diagnostic has wrong source', function () {
      const context = {
        diagnostics: [
          makeDiagnostic({
            source: 'eslint',
            message: 'Some rule violation [fixable]',
          }),
        ],
      };

      const actions = provider.provideCodeActions(null, null, context);

      deepStrictEqual(actions, []);
    });

    test('Returned action has QuickFix kind', function () {
      const context = {
        diagnostics: [
          makeDiagnostic({
            source: 'PHPCS',
            message: 'Spacing issue [fixable]',
          }),
        ],
      };

      const [action] = provider.provideCodeActions(null, null, context);

      strictEqual(action.kind, CodeActionKind.QuickFix);
    });

    test('Returned action command invokes phpSniffer.fixFile', function () {
      const context = {
        diagnostics: [
          makeDiagnostic({
            source: 'PHPCS',
            message: 'Spacing issue [fixable]',
          }),
        ],
      };

      const [action] = provider.provideCodeActions(null, null, context);

      strictEqual(action.command.command, 'phpSniffer.fixFile');
    });

    test('Returns single action even when multiple fixable diagnostics are present', function () {
      const context = {
        diagnostics: [
          makeDiagnostic({ source: 'PHPCS', message: 'Issue one [fixable]' }),
          makeDiagnostic({ source: 'PHPCS', message: 'Issue two [fixable]' }),
        ],
      };

      const actions = provider.provideCodeActions(null, null, context);

      strictEqual(actions.length, 1);
    });

    test('isPreferred is false', function () {
      const context = {
        diagnostics: [
          makeDiagnostic({
            source: 'PHPCS',
            message: 'Spacing issue [fixable]',
          }),
        ],
      };

      const [action] = provider.provideCodeActions(null, null, context);

      strictEqual(action.isPreferred, false);
    });
  });
});
