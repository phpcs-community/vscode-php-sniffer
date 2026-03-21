# Roadmap

## Completed

### Phase 1 — Critical Bug Fixes
- Fixed JSON parsing (stdout/stderr separation)
- Fixed shared mutable args state
- Fixed Windows CRLF line splitting
- Fixed ENOENT detection
- Fixed indent reducer crash on empty input

### Phase 2 — UX & Reliability
- Smart activation events (onLanguage:php + workspaceContains)
- Structured logging with logLevel (off/error/info/debug)
- Process timeout (phpSniffer.timeout)
- Concurrency limit (phpSniffer.maxConcurrentProcesses)
- Max file size skip (phpSniffer.maxFileSize)
- showOutputOnError auto-reveal
- Formatter error notifications

### Phase 3 — Features
- Status bar error/warning counter
- Command palette: Run Lint, Fix File, Show Output, Copy Debug Info
- Executable auto-detection (vendor/bin walk-up)
- Per-file phpcs.xml resolution
- Configurable working directory
- Structured per-run logging
- PHPCS version detection

### Phase 4 — Advanced Features
- Code actions: "Fix with PHPCBF" lightbulb on fixable violations
- Hover provider: rule name and docs on diagnostic hover
- Fix-on-save (phpSniffer.fixOnSave)
- Diff preview before applying fix (phpSniffer.previewFix)
- .phpcsignore pattern support
- Multi-root workspace correctness verified
- $phpcs problem matcher for VS Code tasks
- Ecosystem conflict detection (PHP CS Fixer)
- PHPCS v3/v4 version-aware activation

## Planned

### Phase 5 — Documentation & Community
- [ ] README rewrite with full feature docs
- [ ] CONTRIBUTING.md
- [ ] GitHub Actions CI
- [ ] Migration guide
- [ ] ROADMAP

### Future Ideas
- Integration tests with real PHPCS binary
- TypeScript migration (opt-in, gradual)
- PHPCS config file generator
- Workspace diagnostics summary
- Per-sniff disable/enable quick actions

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).
