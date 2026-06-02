const assert = require('assert');
const {
  Diagnostic,
  DiagnosticSeverity,
  languages,
  Position,
  Range,
  Uri,
} = require('vscode');
const { createStatusBar } = require('../../lib/status-bar');

suite('Status bar (integration)', function () {
  let collection;
  let bar;

  setup(function () {
    collection = languages.createDiagnosticCollection('phpcs-status-bar-test');
  });

  teardown(function () {
    if (bar) {
      bar.dispose();
      bar = null;
    }
    collection.dispose();
  });

  test('createStatusBar() returns object with update and dispose', function () {
    bar = createStatusBar(collection);
    assert.strictEqual(typeof bar.update, 'function');
    assert.strictEqual(typeof bar.dispose, 'function');
  });

  test('update(undefined) does not throw', function () {
    bar = createStatusBar(collection);
    assert.doesNotThrow(() => bar.update(undefined));
  });

  test('update(uri) with errors does not throw', function () {
    const uri = Uri.file('/tmp/phpcs-status-bar-test.php');
    const diag = new Diagnostic(
      new Range(new Position(0, 0), new Position(0, 1)),
      'Test error',
      DiagnosticSeverity.Error,
    );
    collection.set(uri, [diag]);
    bar = createStatusBar(collection);
    assert.doesNotThrow(() => bar.update(uri));
  });

  test('dispose() does not throw', function () {
    bar = createStatusBar(collection);
    assert.doesNotThrow(() => bar.dispose());
    bar = null;
  });
});
