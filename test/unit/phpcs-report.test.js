const { strictEqual } = require('assert');

suite('Report Utilities (Unit)', function () {
  suite('Line ending regex pattern', function () {
    test('Split with /\\r?\\n/ handles CRLF correctly', function () {
      const text = 'line1\r\nline2\r\nline3';
      const lines = text.split(/\r?\n/);
      strictEqual(lines.length, 3);
      strictEqual(lines[0], 'line1');
      strictEqual(lines[1], 'line2');
      strictEqual(lines[2], 'line3');
    });

    test('Split with /\\r?\\n/ handles LF correctly', function () {
      const text = 'line1\nline2\nline3';
      const lines = text.split(/\r?\n/);
      strictEqual(lines.length, 3);
      strictEqual(lines[0], 'line1');
      strictEqual(lines[1], 'line2');
      strictEqual(lines[2], 'line3');
    });

    test('Split with /\\r?\\n/ handles mixed line endings correctly', function () {
      const text = 'line1\nline2\r\nline3';
      const lines = text.split(/\r?\n/);
      strictEqual(lines.length, 3);
      strictEqual(lines[0], 'line1');
      strictEqual(lines[1], 'line2');
      strictEqual(lines[2], 'line3');
    });

    test('Old split with \\n leaves \\r in CRLF text', function () {
      const text = 'line1\r\nline2\r\nline3';
      const lines = text.split('\n');
      // When splitting on \n alone, \r remains at end of each line
      strictEqual(lines[0], 'line1\r');
      strictEqual(lines[1], 'line2\r');
    });
  });
});
