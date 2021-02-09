/**
 * Generates an array of intergers with a 0 representing where
 * an elipsis should be and a number representing the page number.
 *
 * Adapted from https://stackoverflow.com/a/46385144
 */
/* eslint-disable no-bitwise */

const xrange = require('@xrange/core');

const range = (...args) => Array.from(xrange(...args));

const generate = (totalPages, page, maxLength) => {
  if (maxLength < 5) throw new Error('maxLength must be at least 5');

  const sideWidth = maxLength < 9 ? 1 : 2;
  const leftWidth = (maxLength - sideWidth * 2 - 3) >> 1;
  const rightWidth = (maxLength - sideWidth * 2 - 2) >> 1;

  if (totalPages <= maxLength) {
    // no breaks in list
    return range(1, totalPages);
  }
  if (page <= maxLength - sideWidth - 1 - rightWidth) {
    // no break on left of page
    return range(1, maxLength - sideWidth - 1)
      .concat(0, range(totalPages - sideWidth + 1, totalPages));
  }
  if (page >= totalPages - sideWidth - 1 - rightWidth) {
    // no break on right of page
    return range(1, sideWidth)
      .concat(0, range(totalPages - sideWidth - 1 - rightWidth - leftWidth, totalPages));
  }
  // Breaks on both sides
  return range(1, sideWidth)
    .concat(0, range(page - leftWidth, page + rightWidth),
      0, range(totalPages - sideWidth + 1, totalPages));
};

module.exports = generate;
