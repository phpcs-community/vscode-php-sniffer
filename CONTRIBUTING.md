# Contributing

## Development Setup

Requirements: Node.js 24 (use `.nvmrc`), PHP, PHP_CodeSniffer

```bash
nvm use        # or: node --version should be 24.x
npm install
```

## Running Tests

```bash
npm run lint          # ESLint + TypeScript type check
npm run test:unit     # Unit tests (Mocha)
npm run test:integration  # Integration tests (VS Code test runner)
```

## Pull Request Process

1. Fork and create a branch from `main`
2. Make your changes with passing tests
3. Open a PR — CI must be green before review
4. One maintainer approval required to merge

## Reporting Issues

Use the GitHub issue templates for bug reports and feature requests.
