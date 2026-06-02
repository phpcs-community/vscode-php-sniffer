/**
 * @file
 * Unit tests for isIgnoredByPhpcs and matchesIgnorePattern in resolver.js.
 */

const { strictEqual } = require('assert');
const { mkdirSync, writeFileSync, rmSync } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os');

const {
  isIgnoredByPhpcs,
  matchesIgnorePattern,
  clearIgnoreCache,
  findPhpcsIgnore,
  isExcludedByConfig,
  markExcludedByConfig,
  clearExcludedCache,
} = require('../../lib/phpcs-ignore');

suite('matchesIgnorePattern()', function () {
  test('*.php matches foo.php (basename pattern)', function () {
    strictEqual(matchesIgnorePattern('*.php', '/some/path/foo.php'), true);
  });

  test('*.php does not match foo.js (basename pattern)', function () {
    strictEqual(matchesIgnorePattern('*.php', '/some/path/foo.js'), false);
  });

  test('absolute pattern /project/vendor/*.php matches full path', function () {
    strictEqual(
      matchesIgnorePattern(
        '/project/vendor/*.php',
        '/project/vendor/bootstrap.php',
      ),
      true,
    );
  });

  test('absolute pattern /vendor/*.php does not match /project/vendor/foo.php', function () {
    strictEqual(
      matchesIgnorePattern('/vendor/*.php', '/project/vendor/foo.php'),
      false,
    );
  });

  test('vendor/ (trailing slash) matches file inside vendor directory', function () {
    strictEqual(
      matchesIgnorePattern('vendor/', '/project/vendor/foo.php'),
      true,
    );
  });

  test('vendor/*.php (relative) matches /project/vendor/foo.php', function () {
    strictEqual(
      matchesIgnorePattern('vendor/*.php', '/project/vendor/foo.php'),
      true,
    );
  });

  test('vendor/*.php does not match file outside vendor', function () {
    strictEqual(
      matchesIgnorePattern('vendor/*.php', '/project/src/foo.php'),
      false,
    );
  });

  test('? matches single character', function () {
    strictEqual(matchesIgnorePattern('fo?.php', '/path/foo.php'), true);
    strictEqual(matchesIgnorePattern('fo?.php', '/path/fooo.php'), false);
  });

  test('exact filename pattern matches', function () {
    strictEqual(
      matchesIgnorePattern('bootstrap.php', '/any/path/bootstrap.php'),
      true,
    );
    strictEqual(
      matchesIgnorePattern('bootstrap.php', '/any/path/other.php'),
      false,
    );
  });
});

suite('isIgnoredByPhpcs()', function () {
  let tmpDir;

  setup(function () {
    clearIgnoreCache();
    tmpDir = join(tmpdir(), `phpcs-ignore-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  teardown(function () {
    rmSync(tmpDir, { recursive: true, force: true });
    clearIgnoreCache();
  });

  test('returns false when no .phpcsignore file found', function () {
    const filePath = join(tmpDir, 'foo.php');
    strictEqual(isIgnoredByPhpcs(filePath), false);
  });

  test('returns true when filename matches *.php pattern', function () {
    writeFileSync(join(tmpDir, '.phpcsignore'), '*.php\n');
    const filePath = join(tmpDir, 'foo.php');
    strictEqual(isIgnoredByPhpcs(filePath), true);
  });

  test('returns false when filename does not match pattern', function () {
    writeFileSync(join(tmpDir, '.phpcsignore'), '*.php\n');
    const filePath = join(tmpDir, 'foo.js');
    strictEqual(isIgnoredByPhpcs(filePath), false);
  });

  test('ignores comment lines starting with #', function () {
    writeFileSync(join(tmpDir, '.phpcsignore'), '# this is a comment\n*.php\n');
    // The comment itself should not be treated as a pattern
    // Only *.php should match
    const filePath = join(tmpDir, 'foo.php');
    strictEqual(isIgnoredByPhpcs(filePath), true);

    // A file named "# this is a comment" should NOT match
    const commentFile = join(tmpDir, '# this is a comment');
    strictEqual(isIgnoredByPhpcs(commentFile), false);
  });

  test('ignores empty lines', function () {
    writeFileSync(join(tmpDir, '.phpcsignore'), '\n\n*.php\n\n');
    const filePath = join(tmpDir, 'foo.php');
    strictEqual(isIgnoredByPhpcs(filePath), true);
  });

  test('walks up to find .phpcsignore in parent directory', function () {
    writeFileSync(join(tmpDir, '.phpcsignore'), '*.php\n');
    const subDir = join(tmpDir, 'src', 'deep');
    mkdirSync(subDir, { recursive: true });
    const filePath = join(subDir, 'bar.php');
    strictEqual(isIgnoredByPhpcs(filePath), true);
  });

  test('uses nearest .phpcsignore (child overrides parent)', function () {
    // Parent ignores *.php, child has no such pattern
    writeFileSync(join(tmpDir, '.phpcsignore'), '*.php\n');
    const subDir = join(tmpDir, 'src');
    mkdirSync(subDir, { recursive: true });
    // Child .phpcsignore only ignores *.txt — NOT *.php
    writeFileSync(join(subDir, '.phpcsignore'), '*.txt\n');
    const filePath = join(subDir, 'bar.php');
    // Nearest is subDir/.phpcsignore which doesn't match *.php
    strictEqual(isIgnoredByPhpcs(filePath), false);
  });
});

suite('findPhpcsIgnore() caching', function () {
  let tmpDir;

  setup(function () {
    tmpDir = join(
      tmpdir(),
      `phpcs-ignore-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tmpDir, { recursive: true });
    clearIgnoreCache();
  });

  teardown(function () {
    clearIgnoreCache();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('Returns null when no .phpcsignore found', function () {
    const result = findPhpcsIgnore(tmpDir);
    strictEqual(result, null);
  });

  test('Returns file contents when file exists', function () {
    writeFileSync(join(tmpDir, '.phpcsignore'), 'vendor/');
    const result = findPhpcsIgnore(tmpDir);
    strictEqual(result, 'vendor/');
  });

  test('Caches result — re-read returns original value after file changes on disk', function () {
    const ignoreFile = join(tmpDir, '.phpcsignore');
    writeFileSync(ignoreFile, 'vendor/');
    findPhpcsIgnore(tmpDir); // prime cache
    writeFileSync(ignoreFile, 'changed/');
    const result = findPhpcsIgnore(tmpDir);
    strictEqual(result, 'vendor/'); // still original — proves no re-read
  });

  test('clearIgnoreCache() invalidates cache — re-read returns new value', function () {
    const ignoreFile = join(tmpDir, '.phpcsignore');
    writeFileSync(ignoreFile, 'vendor/');
    findPhpcsIgnore(tmpDir); // prime cache
    clearIgnoreCache();
    writeFileSync(ignoreFile, 'changed/');
    const result = findPhpcsIgnore(tmpDir);
    strictEqual(result, 'changed/'); // fresh read after clear
  });
});

suite('Exclusion config cache', function () {
  setup(function () {
    clearExcludedCache();
  });

  teardown(function () {
    clearExcludedCache();
  });

  test('isExcludedByConfig returns false for unknown paths', function () {
    strictEqual(isExcludedByConfig('/some/unknown/file.php'), false);
  });

  test('markExcludedByConfig + isExcludedByConfig returns true', function () {
    markExcludedByConfig('/some/file.php');
    strictEqual(isExcludedByConfig('/some/file.php'), true);
  });

  test('Marking one path does not affect other paths', function () {
    markExcludedByConfig('/path/a.php');
    strictEqual(isExcludedByConfig('/path/b.php'), false);
  });

  test('clearExcludedCache removes all marked paths', function () {
    markExcludedByConfig('/path/a.php');
    markExcludedByConfig('/path/b.php');
    clearExcludedCache();
    strictEqual(isExcludedByConfig('/path/a.php'), false);
    strictEqual(isExcludedByConfig('/path/b.php'), false);
  });
});
