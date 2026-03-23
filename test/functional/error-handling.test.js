const assert = require('assert');
const path = require('path');
const { workspace, Uri } = require('vscode');
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
    await unlink(fileUri.fsPath);
  });

  test('extension recovers after an invalid standard is set', async function () {
    // Step 1: Open file and wait for PSR2 violations.
    const diagnosticsWatch0 = getNextDiagnostics(fileUri);
    await workspace.openTextDocument(fileUri);
    const initialDiags = await diagnosticsWatch0;
    assert(initialDiags.length > 0, 'PSR2 should produce violations on class my_class');

    // Step 2: Switch to invalid standard.
    // Race prevents hanging if phpcs fails silently (no diagnostic change event fires).
    const config = workspace.getConfiguration('phpSniffer', fileUri);
    await config.update('standard', '__NonExistentStandard__');
    const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
    await Promise.race([getNextDiagnostics(fileUri), timeout(3000)]);

    // Step 3: Restore valid standard and assert recovery.
    // Set up watch BEFORE the config update to avoid a race where validation
    // completes before the listener is registered.
    const recoveryWatch = getNextDiagnostics(fileUri);
    await config.update('standard', 'PSR2');
    const recoveredDiags = await recoveryWatch;
    assert(
      recoveredDiags.length > 0,
      'Extension should recover and produce PSR2 diagnostics again',
    );
  });
});
