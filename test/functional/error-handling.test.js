const assert = require('assert');
const path = require('path');
const { commands, window, workspace, Uri } = require('vscode');
const { createFile, writeFile, unlink } = require('fs-extra');
const { execPromise, FIXTURES_PATH } = require('../utils');
const { getNextDiagnostics } = require('./utils');

suite('Error handling', function () {
  this.timeout(15000);

  suiteSetup(async function () {
    this.timeout(60000);
    await execPromise('composer install --no-dev', { cwd: FIXTURES_PATH });

    const config = workspace.getConfiguration('phpSniffer', Uri.file(FIXTURES_PATH));
    await config.update('executablesFolder', `vendor${path.sep}bin${path.sep}`);
    await config.update('standard', 'PSR2');
  });

  suiteTeardown(async function () {
    const config = workspace.getConfiguration('phpSniffer', Uri.file(FIXTURES_PATH));
    await Promise.all([
      config.update('executablesFolder', undefined),
      config.update('standard', undefined),
    ]);
  });

  /** @type {Uri} */
  let fileUri;

  setup(async function () {
    const filePath = path.join(
      FIXTURES_PATH,
      `index${Math.floor(Math.random() * 3000)}.php`,
    );
    fileUri = Uri.file(filePath);
    await createFile(filePath);
    await writeFile(filePath, '<?php class my_class {}\n');
  });

  teardown(async function () {
    await commands.executeCommand('workbench.action.closeAllEditors');
    await unlink(fileUri.fsPath);
  });

  test('extension recovers after an invalid standard is set', async function () {
    const config = workspace.getConfiguration('phpSniffer', fileUri);

    // Step 1: Show file in editor and wait for initial PSR2 violations.
    // window.showTextDocument puts the document in an editor tab so that
    // closeAllEditors will fire onDidCloseTextDocument → diagnostics.delete.
    const initialWatch = getNextDiagnostics(fileUri);
    const doc1 = await workspace.openTextDocument(fileUri);
    await window.showTextDocument(doc1);
    const initialDiags = await initialWatch;
    assert(initialDiags.length > 0, 'PSR2 should produce violations on class my_class');

    // Step 2: Switch to invalid standard; close+reopen to exercise the error path.
    // The extension only re-validates via onDidOpenTextDocument (not on config changes),
    // so close+reopen is needed to trigger a phpcs run with the new standard.
    await config.update('standard', '__NonExistentStandard__');
    await commands.executeCommand('workbench.action.closeAllEditors');
    // onDocumentClose → diagnostics.delete → count: N→0
    const doc2 = await workspace.openTextDocument(fileUri);
    await window.showTextDocument(doc2);
    // phpcs errors with invalid standard → diagnostics.delete → count stays 0.
    // No getNextDiagnostics watch here: count 0→0 would never resolve.

    // Step 3: Restore PSR2; close+reopen to trigger recovery validation.
    await config.update('standard', 'PSR2');
    // Register watch before closing so we don't miss the event.
    const recoveryWatch = getNextDiagnostics(fileUri); // captures count = 0
    await commands.executeCommand('workbench.action.closeAllEditors');
    // onDocumentClose removes doc2 from memory; next openTextDocument fires
    // onDidOpenTextDocument fresh, triggering validation with PSR2.
    const doc3 = await workspace.openTextDocument(fileUri);
    await window.showTextDocument(doc3);
    const recoveredDiags = await recoveryWatch;
    assert(
      recoveredDiags.length > 0,
      'Extension should recover and produce PSR2 diagnostics again',
    );
  });
});
