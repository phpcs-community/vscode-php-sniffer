const assert = require('assert');
const path = require('path');
const { commands, workspace, Uri } = require('vscode');
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
    const config = workspace.getConfiguration('phpSniffer', fileUri);
    await config.update('run', undefined);
    await commands.executeCommand('workbench.action.closeAllEditors');
    await unlink(fileUri.fsPath);
  });

  test('extension recovers after an invalid standard is set', async function () {
    const config = workspace.getConfiguration('phpSniffer', fileUri);

    // Step 1: Open file and wait for initial PSR2 violations.
    // onDidOpenTextDocument triggers validate → phpcs with PSR2 → count 0→N.
    const initialWatch = getNextDiagnostics(fileUri);
    await workspace.openTextDocument(fileUri);
    const initialDiags = await initialWatch;
    assert(initialDiags.length > 0, 'PSR2 should produce violations on class my_class');

    // Step 2: Switch to invalid standard; trigger re-validation via run change.
    // The extension ignores phpSniffer.standard config changes for open documents.
    // Changing phpSniffer.run fires isRunAffect → reset() → diagnostics.clear()
    // (count N→0) and then re-validates all open documents with the new standard.
    await config.update('standard', '__NonExistentStandard__');
    const errorWatch = getNextDiagnostics(fileUri); // captures count = N
    await config.update('run', 'onType'); // isRunAffect → reset → clear → count N→0
    await errorWatch; // resolves when diagnostics.clear() drops count to 0

    // Step 3: Restore PSR2; trigger recovery via another run change.
    // reset() → re-validates open documents with PSR2 → count 0→N.
    await config.update('standard', 'PSR2');
    const recoveryWatch = getNextDiagnostics(fileUri); // captures count = 0
    await config.update('run', 'onSave'); // isRunAffect → reset → re-validates with PSR2
    const recoveredDiags = await recoveryWatch; // resolves when count 0→N
    assert(
      recoveredDiags.length > 0,
      'Extension should recover and produce PSR2 diagnostics again',
    );
  });
});
