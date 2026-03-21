/**
 * @file
 * Unit tests for isIgnoredByPhpcs and matchesIgnorePattern in resolver.js.
 */

const { strictEqual } = require('assert');
const { mkdirSync, writeFileSync, rmSync } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os');

const { isIgnoredByPhpcs, matchesIgnorePattern } = require('../../lib/phpcs-ignore');

suite('matchesIgnorePattern()', function () {
  test('*.php matches foo.php (basename pattern)', function () {
    strictEqual(matchesIgnorePattern('*.php', '/some/path/foo.php'), true);
  });

  test('*.php does not match foo.js (basename pattern)', function () {
    strictEqual(matchesIgnorePattern('*.php', '/some/path/foo.js'), false);
  });

  test('pattern with / is matched against full path (path pattern)', function () {
    // Pattern must match the full path — prefix it to get a full-path match
    strictEqual(matchesIgnorePattern('/project/vendor/*.php', '/project/vendor/bootstrap.php'), true);
  });

  test('vendor/*.php does not match file outside vendor', function () {
    strictEqual(matchesIgnorePattern('vendor/*.php', '/project/src/foo.php'), false);
  });

  test('? matches single character', function () {
    strictEqual(matchesIgnorePattern('fo?.php', '/path/foo.php'), true);
    strictEqual(matchesIgnorePattern('fo?.php', '/path/fooo.php'), false);
  });

  test('exact filename pattern matches', function () {
    strictEqual(matchesIgnorePattern('bootstrap.php', '/any/path/bootstrap.php'), true);
    strictEqual(matchesIgnorePattern('bootstrap.php', '/any/path/other.php'), false);
  });
});

suite('isIgnoredByPhpcs()', function () {
  let tmpDir;

  setup(function () {
    tmpDir = join(tmpdir(), `phpcs-ignore-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  teardown(function () {
    rmSync(tmpDir, { recursive: true, force: true });
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
