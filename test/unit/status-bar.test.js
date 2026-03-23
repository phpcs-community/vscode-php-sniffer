/**
 * @file
 * Unit tests for createStatusBar in lib/status-bar.js.
 */

const { strictEqual } = require('assert');
const { createStatusBar } = require('../../lib/status-bar');

suite('createStatusBar()', function () {
  let item;
  let vscodeMock;
  let bar;

  setup(function () {
    // NOTE: createStatusBar() calls update(window.activeTextEditor?.document.uri)
    // immediately during construction. Since activeTextEditor is undefined in this
    // mock, item.hide() is called once before any test assertion runs.
    // Tests that check item.hid or item.showed must account for this by resetting
    // the counters after creating `bar`, or by using relative counts.
    item = {
      text: '',
      showed: 0,
      hid: 0,
      disposed: false,
      show() { this.showed++; },
      hide() { this.hid++; },
      dispose() { this.disposed = true; },
    };

    vscodeMock = {
      window: {
        createStatusBarItem: () => item,
        onDidChangeActiveTextEditor: () => ({ dispose: () => {} }),
        activeTextEditor: undefined,
      },
      StatusBarAlignment: { Right: 2 },
    };
  });

  teardown(function () {
    if (bar) {
      bar.dispose();
      bar = null;
    }
  });

  test('update(undefined) hides the item', function () {
    bar = createStatusBar({ get: () => [] }, vscodeMock);
    item.hid = 0;
    bar.update(undefined);
    strictEqual(item.hid, 1);
  });

  test('no diagnostics for URI: item.text is $(check) PHPCS and show() is called', function () {
    bar = createStatusBar({ get: () => [] }, vscodeMock);
    item.showed = 0;
    bar.update({});
    strictEqual(item.text, '$(check) PHPCS');
    strictEqual(item.showed, 1);
  });

  test('errors only (2E 0W): item.text is $(error) PHPCS: 2E 0W', function () {
    bar = createStatusBar({ get: () => [{ severity: 0 }, { severity: 0 }] }, vscodeMock);
    bar.update({});
    strictEqual(item.text, '$(error) PHPCS: 2E 0W');
  });

  test('warnings only (0E 3W): item.text is $(error) PHPCS: 0E 3W', function () {
    bar = createStatusBar(
      { get: () => [{ severity: 1 }, { severity: 1 }, { severity: 1 }] },
      vscodeMock,
    );
    bar.update({});
    strictEqual(item.text, '$(error) PHPCS: 0E 3W');
  });

  test('mixed (1E 1W): item.text is $(error) PHPCS: 1E 1W', function () {
    bar = createStatusBar({ get: () => [{ severity: 0 }, { severity: 1 }] }, vscodeMock);
    bar.update({});
    strictEqual(item.text, '$(error) PHPCS: 1E 1W');
  });

  test('dispose() calls item.dispose() and editorListener.dispose()', function () {
    let listenerDisposed = false;
    vscodeMock.window.onDidChangeActiveTextEditor = () => ({
      dispose: () => { listenerDisposed = true; },
    });
    bar = createStatusBar({ get: () => [] }, vscodeMock);
    bar.dispose();
    bar = null;
    strictEqual(item.disposed, true);
    strictEqual(listenerDisposed, true);
  });
});
