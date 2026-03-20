<?php

/**
 * Outputs PHP_CodeSniffer's resolved tabWidth to stderr.
 *
 * Writing to stderr keeps stdout clean for PHPCS's own JSON report,
 * so the runner can parse each stream independently.
 */

fprintf(
  STDERR,
  '{"tabWidth":%d}',
  $this->config->tabWidth ? intval($this->config->tabWidth) : 1
);
