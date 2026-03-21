const { defineConfig } = require('@vscode/test-cli');
const { execFileSync } = require('child_process');

// On NixOS and similar systems, downloaded Electron binaries fail due to
// missing shared libraries. Prefer the system-installed VS Code if available.
// Set VSCODE_EXECUTABLE_PATH to a path to use a specific binary,
// or set it to an empty string to force use of the downloaded Electron
// (useful inside a devShell that provides the necessary libraries via LD_LIBRARY_PATH).
function findSystemVSCode() {
  if ('VSCODE_EXECUTABLE_PATH' in process.env) {
    return process.env.VSCODE_EXECUTABLE_PATH || undefined;
  }
  try {
    return execFileSync('which', ['code'], { encoding: 'utf8' }).trim() || undefined;
  } catch {
    return undefined;
  }
}

const systemVSCode = findSystemVSCode();
const useInstallation = systemVSCode ? { fromPath: systemVSCode } : undefined;

module.exports = defineConfig([
  {
    label: 'Integration',
    workspaceFolder: './test/integration/integration.code-workspace',
    files: 'test/integration/*.test.js',
    mocha: { ui: 'tdd', timeout: 10000 },
    launchArgs: ['--disable-extensions'],
    ...(useInstallation && { useInstallation }),
  },
  {
    label: 'Functional',
    workspaceFolder: './test/fixtures',
    files: 'test/functional/*.test.js',
    mocha: { ui: 'tdd', timeout: 10000 },
    launchArgs: ['--disable-extensions'],
    ...(useInstallation && { useInstallation }),
  },
]);
