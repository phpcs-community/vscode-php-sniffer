# Change Log

All notable changes to the "PHP Sniffer & Beautifier" extension will be documented in this file.

## [2.0.2](https://github.com/phpcs-community/vscode-php-sniffer/compare/v2.0.1...v2.0.2) (2026-03-21)


### Bug Fixes

* correct extension description and add marketplace metadata ([c3ecbb3](https://github.com/phpcs-community/vscode-php-sniffer/commit/c3ecbb324a0260a5447e092dd88358eecf39bddf))

## [2.0.1](https://github.com/phpcs-community/vscode-php-sniffer/compare/v2.0.0...v2.0.1) (2026-03-21)


### Bug Fixes

* use plain v{version} tag format for release-please ([9650f69](https://github.com/phpcs-community/vscode-php-sniffer/commit/9650f696c31b4a57f3558e18058c9d6b9c4a8aa3))

## [2.0.0](https://github.com/phpcs-community/vscode-php-sniffer/compare/php-codesniffer-v1.5.0...php-codesniffer-v2.0.0) (2026-03-21)


### ⚠ BREAKING CHANGES

* This release replaces the original wongjn/vscode-php-sniffer with a fully maintained community fork. Existing phpSniffer.* settings continue to work without changes.

### Features

* add $phpcs problem matcher for VS Code task integration ([b822276](https://github.com/phpcs-community/vscode-php-sniffer/commit/b82227696303414992515ea3026c87db9853debf))
* add CodeActionProvider offering Fix with PHPCBF on fixable violations ([32da267](https://github.com/phpcs-community/vscode-php-sniffer/commit/32da2673ec7dbb200b8b2bff1dca357ba6429cfb))
* add configurable concurrency limit for phpcs processes ([7a38d18](https://github.com/phpcs-community/vscode-php-sniffer/commit/7a38d18f5eb2752fcc9f371dd0d39f20269539e2))
* add configurable process timeout for phpcs/phpcbf ([7e3211c](https://github.com/phpcs-community/vscode-php-sniffer/commit/7e3211c46d0638918f288adda4d3fa313cf8fc68))
* add fixOnSave option to run PHPCBF on file save ([6e3dedc](https://github.com/phpcs-community/vscode-php-sniffer/commit/6e3dedc36bd990b9403c50738be27b0929fdeb42))
* add HoverProvider showing PHPCS rule name and docs link on diagnostic hover ([2d14196](https://github.com/phpcs-community/vscode-php-sniffer/commit/2d141965aad09a3bbdf5324e52b614559c3b98bc))
* add maxFileSize configuration to skip linting oversized files ([8f2f4db](https://github.com/phpcs-community/vscode-php-sniffer/commit/8f2f4db1cc6bb392a6fe99a9f8b821162a11021c))
* add phpSniffer.copyDebugInfo command ([45d3104](https://github.com/phpcs-community/vscode-php-sniffer/commit/45d3104f34ab035efe604c8dec81aaedb10bf442))
* add phpSniffer.workingDirectory config option ([5e5288f](https://github.com/phpcs-community/vscode-php-sniffer/commit/5e5288f864128079812c85cb4bc24d1e5b051062))
* add resolver module with walk-up detection, per-file config, and caching ([dfa381f](https://github.com/phpcs-community/vscode-php-sniffer/commit/dfa381f01b2b50a1f3a8198bd0d0e88478f70394))
* add Run Lint, Fix File, and Show Output commands ([9f31c93](https://github.com/phpcs-community/vscode-php-sniffer/commit/9f31c93784e2d59cd52602832fe68cc45d10d6e5))
* add status bar item showing PHPCS error/warning count ([a824eeb](https://github.com/phpcs-community/vscode-php-sniffer/commit/a824eeb1309a44d82380d2766bad91c1055bbf10))
* add version-aware activation logging for PHPCS v3/v4 ([bdc4fa6](https://github.com/phpcs-community/vscode-php-sniffer/commit/bdc4fa6ccc70e2e6df22a60b5045c50b6211634e))
* add zero-config onboarding notification ([df5b246](https://github.com/phpcs-community/vscode-php-sniffer/commit/df5b2467eafea5c6a38823a1586a1bc751c9c934))
* append [fixable] to diagnostic message for fixable violations ([931a54d](https://github.com/phpcs-community/vscode-php-sniffer/commit/931a54d7bef2ec665c7744e02e69935116bea6bf))
* auto-reveal output channel on error with showOutputOnError config ([acaeb1c](https://github.com/phpcs-community/vscode-php-sniffer/commit/acaeb1c56853e4d1618563cc086a30d3a235790c))
* catch phpcbf errors and log to output channel ([3443799](https://github.com/phpcs-community/vscode-php-sniffer/commit/34437998a732846b7e62d9d62120ae212a572e6f))
* community fork v2 with full phpcs v3/v4 support ([80a9638](https://github.com/phpcs-community/vscode-php-sniffer/commit/80a9638c68e9a3b6d9f222132d4a7e02db42ff1a))
* create logger module with configurable log levels ([f45f060](https://github.com/phpcs-community/vscode-php-sniffer/commit/f45f060a8c679eca9f7bdbac99e9d1710e17aa78))
* create output channel and thread it into validator and formatter ([e052981](https://github.com/phpcs-community/vscode-php-sniffer/commit/e052981a0c3355814d3b4da68c3a725d174ef655))
* detect and log PHP CodeSniffer version at activation ([4c6f71f](https://github.com/phpcs-community/vscode-php-sniffer/commit/4c6f71f7cf2690581b189fb1d158f8e3af6ff695))
* expand conflict detection; remove experimental v4 wording ([db86282](https://github.com/phpcs-community/vscode-php-sniffer/commit/db86282ef9202c7ff6fb253e099e5ae43370963c))
* fix activation events to load only when needed ([c4cbeeb](https://github.com/phpcs-community/vscode-php-sniffer/commit/c4cbeeb5ebbe24cb0432dd573d34e79b1bd742c5))
* invalidate phpcsignore cache when .phpcsignore files change ([3f43f26](https://github.com/phpcs-community/vscode-php-sniffer/commit/3f43f26fc244c9b4d8d70a2a191702959725a067))
* log phpcs errors to output channel ([7a067fb](https://github.com/phpcs-community/vscode-php-sniffer/commit/7a067fbc227c7fc07c3c1b52827eb4aa980c3380))
* log structured info per run at info/debug levels ([0339643](https://github.com/phpcs-community/vscode-php-sniffer/commit/0339643379d21f6a2b4885d14cbfe23c0e965638))
* show diff preview before applying PHPCBF fix when previewFix is enabled ([e0ae8c4](https://github.com/phpcs-community/vscode-php-sniffer/commit/e0ae8c42b67e38211f7f0373afb78ff2b4ddb2b1))
* show error message to user when formatter fails ([6226524](https://github.com/phpcs-community/vscode-php-sniffer/commit/622652425f8ec0ea976ac677cbd33f080aeea390))
* skip formatter registration when conflicting PHP formatter extension is active ([76e322c](https://github.com/phpcs-community/vscode-php-sniffer/commit/76e322c6fe74e50ee4b50162ba7d5bfeeb28cde3))
* skip validation and formatting for files matching .phpcsignore patterns ([e362dda](https://github.com/phpcs-community/vscode-php-sniffer/commit/e362ddad141a6ab4827f4e5c04c9ca9e64c22d56))
* standard-aware docs links in hover; fix code action title ([6b6a18e](https://github.com/phpcs-community/vscode-php-sniffer/commit/6b6a18e439efd017e554d55ea4bfd816f8572f1b))
* verify and document multi-root workspace support; fix any first-folder assumptions in hot paths ([1086890](https://github.com/phpcs-community/vscode-php-sniffer/commit/10868909279f0c9f76bffb8144a96699e03b6969))


### Bug Fixes

* add exitCodeThreshold to executeCommand, fix phpcbf exit code handling ([1ed6caf](https://github.com/phpcs-community/vscode-php-sniffer/commit/1ed6caf46191747113dc3ad79a2c30e3cb068236))
* add permissions: contents: read to CI workflow for least-privilege ([50438a5](https://github.com/phpcs-community/vscode-php-sniffer/commit/50438a54215ae3380e32ff26c7b827325d2f6342))
* address review findings ([a15883e](https://github.com/phpcs-community/vscode-php-sniffer/commit/a15883edc3e002385d07d77f3c4967a32c30a6f4))
* address review issues in onboarding catch and workingDirectory behavior ([fe9ae1b](https://github.com/phpcs-community/vscode-php-sniffer/commit/fe9ae1b1448f6c768ab58a8fc08d5eac274fcff2))
* address review issues in resolver cache, runLint, fixFile, and status bar ([3aac870](https://github.com/phpcs-community/vscode-php-sniffer/commit/3aac8708828814c2449c682a5cd2f9cb9c0ffe89))
* annotate stdin error as ErrnoException for TypeScript ([f530f8f](https://github.com/phpcs-community/vscode-php-sniffer/commit/f530f8f1ad013dc0aa46018a3b328b88586a9dcf))
* cache phpcsignore lookups; fix relative and directory pattern matching ([595ad3f](https://github.com/phpcs-community/vscode-php-sniffer/commit/595ad3fd3565e3bc17ec45cb12f9bcdef704a444))
* call activateGenericFormatter without channel (it doesn't use it yet) ([168f08e](https://github.com/phpcs-community/vscode-php-sniffer/commit/168f08e98ebf788b3a24d129d2431f6e5f12d0fa))
* consistent Hover constructor call; update createValidator return typedef ([4f5d22d](https://github.com/phpcs-community/vscode-php-sniffer/commit/4f5d22d9c57074615814b63b245d022d8e533779))
* correct phpcs/phpcbf 4.x exit codes and register PHP document formatter ([3e5bdae](https://github.com/phpcs-community/vscode-php-sniffer/commit/3e5bdae33235a9eb88b1cc73c66e045ee044a52a))
* correct timeout default, workingDirectory description; remove stray extraArgs row ([812cb14](https://github.com/phpcs-community/vscode-php-sniffer/commit/812cb1483ab50af0d5428169fecdc517f466d542))
* handle CRLF line endings in phpcs-report column calculation ([d8c9539](https://github.com/phpcs-community/vscode-php-sniffer/commit/d8c95393c6a6d7ba2e44fcd0b8c74dc366786de5))
* handle phpcbf errors in fixOnSave, cancel before VS Code save timeout ([89d551b](https://github.com/phpcs-community/vscode-php-sniffer/commit/89d551b52c99759d7972152372672f9b1afe75fa))
* handle phpcs 4.x exit codes 0-2 as success, remove runtime-set workaround ([e70ee12](https://github.com/phpcs-community/vscode-php-sniffer/commit/e70ee121bde280bf20b487a8e60605ac9970986e))
* handle phpcs.xml-excluded files silently across phpcs v3 and v4 ([4e3059e](https://github.com/phpcs-community/vscode-php-sniffer/commit/4e3059e828ffcc908a4edc93015a9da1185fb856))
* harden cli.js for Node 24 and address code quality issues ([8fa6ff7](https://github.com/phpcs-community/vscode-php-sniffer/commit/8fa6ff7bf40ff807be2044c779e73bbb08a12773))
* move version require to top of resolver; normalize path for absolute phpcsignore patterns ([b493c6a](https://github.com/phpcs-community/vscode-php-sniffer/commit/b493c6a35c26f35546fac74dd159cd6c9dd96ebc))
* prevent RangeError when all snippet lines are empty in getIndentation ([0e0df63](https://github.com/phpcs-community/vscode-php-sniffer/commit/0e0df631df3d4c009a0634f4c1c92aa9971e2d53))
* prevent shared mutable args Map from leaking state between phpcbf and phpcs calls ([618d0a8](https://github.com/phpcs-community/vscode-php-sniffer/commit/618d0a82a20f32582cd71510d297f87ef835ff92))
* remove noisy Window progress indicator from validation ([fd6b09c](https://github.com/phpcs-community/vscode-php-sniffer/commit/fd6b09c0f98e2837a8c2c63adae53024e3403785))
* remove object-curly-newline rule that conflicts with Prettier ([526d6c6](https://github.com/phpcs-community/vscode-php-sniffer/commit/526d6c6aebb878a4d7b599e161299f0225c450a9))
* rename display name to PHP_CodeSniffer Community ([a65b17e](https://github.com/phpcs-community/vscode-php-sniffer/commit/a65b17efdac2255242b5731476086dd39b8c4a71))
* replace stdout-wrapping hack with stderr-based tab-width passing ([5d8866e](https://github.com/phpcs-community/vscode-php-sniffer/commit/5d8866e6e11103a56d1a0d62a93b71ae055ddce2))
* runLint writes to validator diagnostics collection; document previewFix temp file limitation ([33d1a4f](https://github.com/phpcs-community/vscode-php-sniffer/commit/33d1a4f96e43e519abb5352f40d1f2d5ef908d9d))
* scope fixOnSave config to document.uri for multi-root workspace correctness ([1194905](https://github.com/phpcs-community/vscode-php-sniffer/commit/11949051f9a6594b31cf762ff7d7f8226aa01893))
* set action.diagnostics for correct VS Code Problems panel integration ([87e5e06](https://github.com/phpcs-community/vscode-php-sniffer/commit/87e5e06b44ec3e688828dce19580502c1e83e62b))
* update display name to PHP_CodeSniffer & Beautifier to avoid marketplace conflict ([80d7279](https://github.com/phpcs-community/vscode-php-sniffer/commit/80d7279ea833b17814c8422cbb0e54f715dc9191))
* update hover provider test to use PHPCSStandards URL ([7413aae](https://github.com/phpcs-community/vscode-php-sniffer/commit/7413aaea24b5b002d8d876d100864763161167f0))
* update Open VSX namespace from phpcs-community to phpcscommunity ([f71b043](https://github.com/phpcs-community/vscode-php-sniffer/commit/f71b04343d795fa20755018aec7d65d559c2a919))
* use absolute fileLocation and strip [x] marker in phpcs problem matcher ([79040b3](https://github.com/phpcs-community/vscode-php-sniffer/commit/79040b3a3ee4a537c2869dadcd8964b3e511ccca))
* use async writeFile for diff preview; clean up temp file on close ([13813f7](https://github.com/phpcs-community/vscode-php-sniffer/commit/13813f7848ef931f7af15b7fe1fef130e24e7706))
* use consistent HH:MM:SS timestamp format in logger ([201cf7f](https://github.com/phpcs-community/vscode-php-sniffer/commit/201cf7f5d9b7067f2d11b3693ae9699dea801193))
* use correct publisher IDs for VS Marketplace (phpcscommunity) and Open VSX (phpcs-community) ([a87818f](https://github.com/phpcs-community/vscode-php-sniffer/commit/a87818fe6f6062de4c64e3fa6fcd9943cf92ad4d))
* use error.code ENOENT instead of fragile message string matching ([2372790](https://github.com/phpcs-community/vscode-php-sniffer/commit/23727908dc8417b7780f88364aa3195017eb1c17))
* use installed-check for formatter conflict detection; remove Intelephense false positive ([83ce868](https://github.com/phpcs-community/vscode-php-sniffer/commit/83ce86834e1f5e790b462033ec074f5337f00cf4))
* use npx to invoke vsce in publish script ([6462fc6](https://github.com/phpcs-community/vscode-php-sniffer/commit/6462fc609d2122051f99a119387fef16de95efbb))
* use PHPCSStandards repo URL for built-in standard docs links ([8634dbc](https://github.com/phpcs-community/vscode-php-sniffer/commit/8634dbc8eda7c490c98cf5fe2a472ea40f3b3104))
* use stdio: pipe in spawn to resolve TypeScript 5.x null-safety warnings ([7aa1297](https://github.com/phpcs-community/vscode-php-sniffer/commit/7aa129771267407b779edd75440d12ca53eae483))

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
