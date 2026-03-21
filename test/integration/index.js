const path = require('path');
const Mocha = require('mocha');
const glob = require('glob');

async function run(testsRoot, cb) {
  // Create the mocha test.
  const mocha = new Mocha({ ui: 'tdd' });
  mocha.useColors(true);

  try {
    const files = await glob('**/**.test.js', { cwd: testsRoot });

    // Add files to the test suite.
    files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

    // Run the mocha test.
    mocha.run((failures) => {
      cb(null, failures);
    });
  } catch (err) {
    cb(err);
  }
}

module.exports.run = run;
