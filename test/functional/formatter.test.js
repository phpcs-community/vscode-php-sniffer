const path = require('path');
const assert = require('assert');
const {
  CancellationTokenSource,
  commands,
  Range,
  workspace,
  WorkspaceEdit,
  Uri,
} = require('vscode');
const { createFormatter } = require('../../lib/formatter');

const { Formatter, PhpDocumentFormatter } = createFormatter({ appendLine: () => {} });
const { execPromise, FIXTURES_PATH } = require('../utils');
const {
  markExcludedByConfig,
  clearExcludedCache,
} = require('../../lib/phpcs-ignore');

suite('Formatter', function () {
  const fixtureUri = Uri.file(
    path.join(FIXTURES_PATH, `index${Math.floor(Math.random() * 3000)}.php`),
  );
  const textEncoder = new TextEncoder();

  setup(async function () {
    // Reset file to unformatted state and release in-memory document before each test.
    // Without closing all editors, VS Code may return the previously-edited in-memory
    // document instead of re-reading from disk.
    await commands.executeCommand('workbench.action.closeAllEditors');
    await workspace.fs.writeFile(
      fixtureUri,
      textEncoder.encode('<?php\n$foo = TRUE;\n'),
    );
  });

  teardown(function () {
    clearExcludedCache();
  });

  suiteSetup(async function () {
    this.timeout(60000);

    const config = workspace.getConfiguration('phpSniffer', fixtureUri);

    await execPromise('composer install --no-dev', { cwd: FIXTURES_PATH });

    await Promise.all([
      workspace.fs.writeFile(
        fixtureUri,
        textEncoder.encode('<?php\n$foo = TRUE;\n'),
      ),
      config.update('executablesFolder', `vendor${path.sep}bin${path.sep}`),
      config.update('standard', './tab-indent.xml'),
    ]);
  });

  suiteTeardown(function () {
    const config = workspace.getConfiguration('phpSniffer', fixtureUri);
    return Promise.all([
      workspace.fs.delete(fixtureUri),
      config.update('executablesFolder', undefined),
      config.update('standard', undefined),
    ]);
  });

  test('Document fragments can be formatted', async function () {
    const document = await workspace.openTextDocument(fixtureUri);

    const edits = await Formatter.provideDocumentRangeFormattingEdits(
      document,
      new Range(1, 0, 1, 12),
      { tabSize: 2, insertSpaces: true },
      new CancellationTokenSource().token,
    );

    assert.strictEqual(1, edits.length);

    const formatEdit = new WorkspaceEdit();
    formatEdit.set(fixtureUri, edits);
    await workspace.applyEdit(formatEdit);
    assert.strictEqual(document.getText(), '<?php\n$foo = true;\n');
  });

  test('Full document can be formatted', async function () {
    const document = await workspace.openTextDocument(fixtureUri);

    const edits = await PhpDocumentFormatter.provideDocumentFormattingEdits(
      document,
      { tabSize: 2, insertSpaces: true },
      new CancellationTokenSource().token,
    );

    const formatEdit = new WorkspaceEdit();
    formatEdit.set(fixtureUri, edits);
    await workspace.applyEdit(formatEdit);
    assert.strictEqual(document.getText(), '<?php\n$foo = true;\n');
  });

  test('Returns empty edits for file excluded by config', async function () {
    markExcludedByConfig(fixtureUri.fsPath);
    const document = await workspace.openTextDocument(fixtureUri);

    const edits = await Formatter.provideDocumentRangeFormattingEdits(
      document,
      new Range(1, 0, 1, 12),
      { tabSize: 2, insertSpaces: true },
      new CancellationTokenSource().token,
    );

    assert.strictEqual(edits.length, 0);
  });
});
