const path = require("path");
const { execFileSync } = require("child_process");
const { runTests } = require("@vscode/test-electron");

/**
 * Finds the system VS Code executable, for environments (e.g. NixOS) where
 * downloaded Electron binaries fail due to missing shared libraries.
 *
 * Override by setting VSCODE_ELECTRON_BINARY_PATH env var.
 *
 * @return {string|undefined}
 */
function findSystemVSCode() {
  if (process.env.VSCODE_ELECTRON_BINARY_PATH) {
    return process.env.VSCODE_ELECTRON_BINARY_PATH;
  }
  try {
    const bin = execFileSync("which", ["code"], { encoding: "utf8" }).trim();
    return bin || undefined;
  } catch (e) {
    return undefined;
  }
}

async function test() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    const vscodeExecutablePath = findSystemVSCode();
    const baseOptions = vscodeExecutablePath ? { vscodeExecutablePath } : {};

    await runTests({
      ...baseOptions,
      extensionDevelopmentPath,
      extensionTestsPath: path.resolve(__dirname, "./integration"),
      launchArgs: [
        path.resolve(__dirname, "./integration/integration.code-workspace"),
      ],
    });

    await runTests({
      ...baseOptions,
      extensionDevelopmentPath,
      extensionTestsPath: path.resolve(__dirname, "./functional"),
      launchArgs: [path.resolve(__dirname, "./fixtures")],
    });
  } catch (err) {
    process.exit(1);
  }
}

test();
