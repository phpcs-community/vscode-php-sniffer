# Change Log

All notable changes to the "PHP Sniffer & Beautifier" extension will be documented in this file.

## [1.5.0] - 2026-03-19

### Added

- PHP CodeSniffer output channel in the VS Code Output panel — phpcs and phpcbf errors are now logged with timestamps instead of only showing as popups

## [1.4.0] - 2026-03-18

### Changed

- Forked from [wongjn/vscode-php-sniffer](https://github.com/wongjn/vscode-php-sniffer) as a community-maintained fork
- Publisher set to `phpcscommunity` on VS Marketplace, `phpcs-community` on Open VSX
- Updated VS Code engine requirement to `^1.90.0`
- Modernized dependencies: Node 24, TypeScript 5.x, ESLint 8.x, Mocha 10.x

### Fixed

- phpcbf exit code 1 (changes made) now correctly treated as success — formatting no longer silently fails
- phpcs exit codes 0–2 now correctly parsed as successful lint results; removed `ignore_warnings_on_exit` runtime workaround
- PHP_CodeSniffer 4.x compatibility for exit codes
