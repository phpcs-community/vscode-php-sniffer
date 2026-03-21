# PHP Sniffer & Beautifier

> Community-maintained VS Code extension for PHP_CodeSniffer — real-time linting and auto-fix for PHP, powered by `phpcs` and `phpcbf`.

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/phpcscommunity.php-codesniffer)](https://marketplace.visualstudio.com/items?itemName=phpcscommunity.php-codesniffer)
[![Open VSX](https://img.shields.io/open-vsx/v/phpcscommunity/php-codesniffer?label=Open%20VSX)](https://open-vsx.org/extension/phpcscommunity/php-codesniffer)
[![CI](https://github.com/phpcs-community/vscode-php-sniffer/actions/workflows/ci.yml/badge.svg)](https://github.com/phpcs-community/vscode-php-sniffer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Real-time linting** — runs `phpcs` on save or as you type, surfacing errors and warnings in the Problems panel and inline with squiggles.
- **Auto-fix on save** — enable `phpSniffer.fixOnSave` to automatically run `phpcbf` every time you save a PHP file.
- **Format Document / Format Selection** — use VS Code's built-in format commands to run `phpcbf` on the whole file or a selected region.
- **Code actions** — a lightbulb appears on fixable violations (marked `[fixable]`), letting you apply PHPCBF fixes inline without leaving the editor.
- **Diff preview** — optionally preview the changes PHPCBF would make before they are applied (`phpSniffer.previewFix`).
- **Hover documentation** — hover over any violation to see the rule name and a direct link to its documentation.
- **Status bar** — a clickable status bar item shows the current error and warning count for the active file.
- **Structured logging** — a dedicated output channel with configurable verbosity (`phpSniffer.logLevel`), including full `phpcs` command logging at `debug` level.
- **Executable auto-detection** — automatically finds `vendor/bin/phpcs` by walking up from the open file, so per-project installs work with zero configuration.
- **Per-file config resolution** — the nearest `phpcs.xml` / `.phpcs.xml` / `phpcs.xml.dist` file is used automatically.
- **Multi-root workspace support** — each workspace folder can have its own `phpSniffer.*` settings.
- **`.phpcsignore` support** — files matching ignore patterns are silently skipped.
- **`$phpcs` problem matcher** — a built-in problem matcher for use in VS Code task definitions.
- **PHPCS version detection** — logs the detected PHPCS version (v3 or v4) at activation.

## Requirements

- VS Code **1.90** or newer
- [PHP](https://php.net) available on the system
- [PHP_CodeSniffer](https://github.com/PHPCSStandards/PHP_CodeSniffer) **v3 or v4**, installed globally or via Composer

## Quick Start

1. **Install the extension** from the VS Code Marketplace (search for `PHP_CodeSniffer Community` or publisher `phpcscommunity`).

2. **Install PHP_CodeSniffer** — globally:
   ```bash
   composer global require squizlabs/php_codesniffer
   ```
   or as a project dependency:
   ```bash
   composer require --dev squizlabs/php_codesniffer
   ```
   When installed as a project dependency, enable auto-detection so the extension finds it automatically:
   ```json
   { "phpSniffer.autoDetect": true }
   ```

3. **Open a PHP file** — diagnostics appear in the Problems panel immediately. That is all the setup needed for most projects.

To set this extension as the default PHP formatter (required for Format Document to use PHPCBF):
```json
{
  "[php]": {
    "editor.defaultFormatter": "phpcscommunity.php-codesniffer"
  }
}
```

## Configuration

All settings are prefixed with `phpSniffer.` and can be set at user, workspace, or folder level unless noted.

| Setting | Type | Default | Description |
|---|---|---|---|
| `phpSniffer.run` | `string` | `"onSave"` | When to run `phpcs`. One of `onSave`, `onType`, or `never`. |
| `phpSniffer.onTypeDelay` | `number` | `250` | Milliseconds to wait after typing stops before running `phpcs` (only when `run` is `onType`). |
| `phpSniffer.executablesFolder` | `string` | `""` | Folder containing the `phpcs` and `phpcbf` executables. Can be absolute or relative to the workspace folder. Leave empty to use `$PATH` or auto-detection. |
| `phpSniffer.autoDetect` | `boolean` | `false` | Automatically detect `vendor/bin/` as the executables folder per workspace folder. Only applies when `executablesFolder` is empty. |
| `phpSniffer.standard` | `string` | `""` | Coding standard passed to `phpcs`/`phpcbf` as `--standard`. Can be a standard name or a path to a ruleset file (absolute or relative to the workspace). If empty, PHPCS searches for a config file automatically. |
| `phpSniffer.extraArgs` | `array` | `[]` | Additional arguments appended to every `phpcs` invocation. |
| `phpSniffer.extraFiles` | `array` | `[]` | Glob patterns for non-PHP file types the extension should lint (e.g. for standards that validate `.inc` files). PHP files are always included. |
| `phpSniffer.snippetExcludeSniffs` | `array` | `[]` | Sniffs to pass as `--exclude` when formatting a selection or snippet (not a whole file). |
| `phpSniffer.disableWhenDebugging` | `boolean` | `false` | Pause linting while a debug session is active. Scoped to machine. |
| `phpSniffer.logLevel` | `string` | `"error"` | Output channel verbosity. One of `off`, `error`, `info`, or `debug`. Use `debug` to log full PHPCS commands and arguments. |
| `phpSniffer.showOutputOnError` | `boolean` | `true` | Automatically reveal the output channel when an error occurs. |
| `phpSniffer.fixOnSave` | `boolean` | `false` | Run `phpcbf` automatically on every file save. |
| `phpSniffer.previewFix` | `boolean` | `false` | Show a diff preview of PHPCBF changes before applying them. |
| `phpSniffer.timeout` | `number` | `10` | Seconds before a `phpcs`/`phpcbf` process is killed. |
| `phpSniffer.maxConcurrentProcesses` | `number` | `4` | Maximum number of concurrent `phpcs` processes. Set to `0` for unlimited. |
| `phpSniffer.maxFileSize` | `number` | `0` | Skip files larger than this value in kilobytes. Set to `0` to disable the limit. |
| `phpSniffer.workingDirectory` | `string` | `"auto"` | Working directory for PHPCS processes. One of `auto` (nearest config file directory), `workspaceRoot`, or `fileDir`. |

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type `PHP Sniffer` to see all available commands.

| Command ID | Title | Description |
|---|---|---|
| `phpSniffer.runLint` | PHP Sniffer: Run Lint | Manually trigger `phpcs` on the active file. |
| `phpSniffer.fixFile` | PHP Sniffer: Fix File | Run `phpcbf` on the active file and apply fixes immediately. |
| `phpSniffer.showOutput` | PHP Sniffer: Show Output Channel | Reveal the PHP Sniffer output channel. |
| `phpSniffer.copyDebugInfo` | PHP Sniffer: Copy Debug Info | Copy diagnostic information (extension version, PHPCS version, config, OS) to the clipboard for use in bug reports. |

## Problem Matcher

A built-in `$phpcs` problem matcher is included for use in `tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "phpcs",
      "type": "shell",
      "command": "phpcs --report=full src/",
      "problemMatcher": "$phpcs"
    }
  ]
}
```

## Debugging

If linting is not working as expected:

1. **Enable debug logging** — add to your settings:
   ```json
   { "phpSniffer.logLevel": "debug" }
   ```
   Then open the output channel via **PHP Sniffer: Show Output Channel**. The full `phpcs` command, arguments, working directory, and process output are logged for every run.

2. **Copy debug info** — run **PHP Sniffer: Copy Debug Info** from the Command Palette. This copies a structured summary of the extension version, detected PHPCS version, resolved configuration, and OS details to your clipboard. Paste this into any bug report.

3. **Check the executable path** — if auto-detection is enabled, the log shows which `vendor/bin/phpcs` path was resolved. If the wrong binary is being used, set `phpSniffer.executablesFolder` explicitly.

**What to include in a bug report:**
- Output of **Copy Debug Info**
- The content of your `phpcs.xml` or relevant `settings.json` entries
- The full output from the output channel with `logLevel` set to `debug`

## Why This Fork?

[wongjn/vscode-php-sniffer](https://github.com/wongjn/vscode-php-sniffer) is no longer actively maintained. This community fork was created to:

- Keep the extension working with current VS Code versions (1.90+) and PHPCS v3/v4
- Fix outstanding bugs from the original repository
- Add features the PHP community needs: code actions, hover documentation, fix-on-save, diff preview, status bar, structured logging, multi-root workspace support, and more
- Provide a stable, maintained extension going forward

The PHP community now maintains this extension under [phpcs-community/vscode-php-sniffer](https://github.com/phpcs-community/vscode-php-sniffer).

## Migration from wongjn/vscode-php-sniffer

Migration requires no configuration changes. The `phpSniffer.*` settings namespace is identical to the original extension.

Steps:
1. Uninstall `wongjn.vscode-php-sniffer` from VS Code.
2. Install `phpcscommunity.php-codesniffer` from the Marketplace.
3. Restart VS Code.

Your existing `settings.json` entries under `phpSniffer.*` continue to work without modification.

## Community

- **Bug reports and feature requests:** [GitHub Issues](https://github.com/phpcs-community/vscode-php-sniffer/issues)
- **Contributing:** Pull requests are welcome. Please open an issue first to discuss significant changes.
- **Repository:** [github.com/phpcs-community/vscode-php-sniffer](https://github.com/phpcs-community/vscode-php-sniffer)

## License

MIT — see [LICENSE](LICENSE) for details.
