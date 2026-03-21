'use strict';

/**
 * @file
 * PHPCS version parsing utilities.
 */

/**
 * Parses the major version number from a PHPCS version string.
 *
 * @param {string|null} version - version string like "3.7.2" or null
 * @returns {number} major version number, or 0 if unknown
 */
function parseMajorVersion(version) {
  if (!version) return 0;
  const major = parseInt(version.split('.')[0], 10);
  return isNaN(major) ? 0 : major;
}

module.exports = { parseMajorVersion };
