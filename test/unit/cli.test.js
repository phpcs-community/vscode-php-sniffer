const {
  deepStrictEqual,
  doesNotReject,
  rejects,
  strictEqual,
} = require('assert');
const {
  mapToCliArgs,
  executeCommand,
  CliCommandError,
} = require('../../lib/cli');
const { createStubToken, createMockToken } = require('../utils');

suite('CLI Utilities', function () {
  suite('mapToCliArgs()', function () {
    test('Values passed compile correctly', function () {
      const args1 = new Map([['a', 'b']]);
      deepStrictEqual(mapToCliArgs(args1), ['--a=b']);

      const args2 = new Map([
        ['a', 'b'],
        ['c', '1'],
      ]);
      deepStrictEqual(mapToCliArgs(args2), ['--a=b', '--c=1']);

      const args3 = new Map([
        ['a', 'b'],
        ['c', ''],
      ]);
      deepStrictEqual(
        mapToCliArgs(args3),
        ['--a=b'],
        'Entries with empty values should not be compiled.',
      );

      const args4 = new Map([
        ['a', 'b'],
        ['', '1'],
      ]);
      deepStrictEqual(
        mapToCliArgs(args4),
        ['--a=b'],
        'Entries with empty keys should not be compiled.',
      );
    });

    test('Only values that need quotes are quoted when requested', function () {
      const args1 = new Map([
        ['a', 'no-quotes'],
        ['b', 'needs quotes'],
      ]);

      deepStrictEqual(mapToCliArgs(args1), [
        '--a=no-quotes',
        '--b=needs quotes',
      ]);
      deepStrictEqual(mapToCliArgs(args1, true), [
        '--a=no-quotes',
        '--b="needs quotes"',
      ]);
    });
  });

  suite('executeCommand()', function () {
    test('Normal execution returns { stdout, stderr }', async function () {
      const result = await executeCommand({
        command: 'echo',
        token: createStubToken(),
        args: ['foobar'],
      });

      deepStrictEqual(result, { stdout: 'foobar\n', stderr: '' });
    });

    test('Cancelling the execution via the token returns null', async function () {
      const token = createMockToken();

      const result = executeCommand({
        command: process.platform === 'win32' ? 'timeout' : 'sleep',
        token,
        args: ['10'],
      });

      token.cancel();
      strictEqual(await result, null);
    });

    test('Non-zero exit code rejects', function () {
      return rejects(
        executeCommand({
          command: './non-zero-exit',
          token: createStubToken(),
          spawnOptions: { cwd: __dirname },
        }),
        { message: 'foo\nbar' },
      );
    });

    test('Nonsense command rejects', function () {
      return rejects(
        executeCommand({
          command: 'foo-bar-baz',
          token: createStubToken(),
        }),
      );
    });

    test('Command with spaces', async function () {
      const result = await executeCommand({
        command: './command with spaces',
        token: createStubToken(),
        spawnOptions: {
          shell: process.platform === 'win32',
          cwd: __dirname,
        },
      });

      deepStrictEqual(result, { stdout: 'foo', stderr: '' });
    });

    test('stderr is captured separately from stdout', async function () {
      const result = await executeCommand({
        command: 'node',
        token: createStubToken(),
        args: [
          '-e',
          'process.stdout.write("out"); process.stderr.write("err")',
        ],
      });

      deepStrictEqual(result, { stdout: 'out', stderr: 'err' });
    });

    test('tabWidth parsed from stderr, falls back to 1 on empty stderr', function () {
      // Simulate the runner's stderr parsing logic inline.
      function parseTabWidth(stderr) {
        try {
          const data = JSON.parse(stderr);
          if (typeof data.tabWidth === 'number') return data.tabWidth;
        } catch {
          /* ignore */
        }
        return 1;
      }

      strictEqual(parseTabWidth('{"tabWidth":4}'), 4);
      strictEqual(parseTabWidth('{"tabWidth":2}'), 2);
      strictEqual(parseTabWidth(''), 1);
      strictEqual(parseTabWidth('not json'), 1);
      strictEqual(parseTabWidth('{}'), 1);
    });
  });
});

/** Minimal cancellation token stub — no vscode import needed */
const token = {
  isCancellationRequested: false,
  onCancellationRequested: () => ({ dispose: () => {} }),
};

suite('executeCommand exitCodeThreshold', function () {
  test('throws on exit code 1 by default', async function () {
    await rejects(
      () =>
        executeCommand({
          command: 'node',
          args: ['-e', 'process.exit(1)'],
          token,
        }),
      (err) => err instanceof CliCommandError && err.exitCode === 1,
    );
  });

  test('does not throw on exit code 1 when threshold is 1', async function () {
    await doesNotReject(() =>
      executeCommand({
        command: 'node',
        args: ['-e', 'process.exit(1)'],
        token,
        exitCodeThreshold: 1,
      }),
    );
  });

  test('throws on exit code 2 when threshold is 1', async function () {
    await rejects(
      () =>
        executeCommand({
          command: 'node',
          args: ['-e', 'process.exit(2)'],
          token,
          exitCodeThreshold: 1,
        }),
      (err) => err instanceof CliCommandError && err.exitCode === 2,
    );
  });

  test('does not throw on exit code 2 when threshold is 2 (phpcbf 4.x partial fix)', async function () {
    await doesNotReject(() =>
      executeCommand({
        command: 'node',
        args: ['-e', 'process.exit(2)'],
        token,
        exitCodeThreshold: 2,
      }),
    );
  });

  test('does not throw on exit code 3 when threshold is 3 (phpcs 4.x fixable errors)', async function () {
    await doesNotReject(() =>
      executeCommand({
        command: 'node',
        args: ['-e', 'process.exit(3)'],
        token,
        exitCodeThreshold: 3,
      }),
    );
  });

  test('throws on exit code 4 when threshold is 3', async function () {
    await rejects(
      () =>
        executeCommand({
          command: 'node',
          args: ['-e', 'process.exit(4)'],
          token,
          exitCodeThreshold: 3,
        }),
      (err) => err instanceof CliCommandError && err.exitCode === 4,
    );
  });
});
