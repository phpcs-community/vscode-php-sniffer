# Contributing to PHP Sniffer & Beautifier

Thank you for your interest in contributing! This is a community-maintained fork of wongjn/vscode-php-sniffer.

## Development Setup

Requirements: Node.js 18+, npm, VS Code

```bash
git clone https://github.com/phpcs-community/vscode-php-sniffer.git
cd vscode-php-sniffer
npm install
```

### Running Tests

```bash
npm run test:unit
```

### Running the Extension Locally

Press F5 in VS Code to open an Extension Development Host.

## Project Structure

- `extension.js` — entry point, activation
- `lib/` — core modules
  - `runner.js` — phpcs/phpcbf process management
  - `validator.js` — real-time linting
  - `formatter.js` — document/range formatting
  - `resolver.js` — executable and config resolution
  - `commands.js` — command palette commands
  - `code-actions.js` — quick fix actions
  - `hover-provider.js` — hover documentation
  - `status-bar.js` — status bar item
  - `phpcs-ignore.js` — .phpcsignore support
  - `logger.js` — structured logging
  - `queue.js` — concurrency control
  - `version.js` — version parsing
- `test/` — mocha tests (unit + integration)

## Pull Requests

- Open an issue first for large changes
- Follow existing code style (CommonJS, JSDoc types, no TypeScript)
- Add tests for new behaviour
- All tests must pass: `npm run test:unit`

## Good First Issues

Look for issues labelled `good first issue` on GitHub.

## Reporting Bugs

Include output from "PHP Sniffer: Copy Debug Info" command.
