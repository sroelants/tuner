/** @typedef {Object} Rect
 *  @property {number} x1
 *  @property {number} y1
 *  @property {number} x2
 *  @property {number} y2
 */

/**
 * Get the width of a rectangle
 * @param {Rect} The rectangle whose width we want
 * @returns {number} The width of the rectangle
 */
export function width(rect) {
  return rect.x2 - rect.x1;
}

/**
 * Get the height of a rectangle
 * @param {Rect} The rectangle whose height we want
 * @returns {number} The height of the rectangle
 */
export function height(rect) {
  return rect.y2 - rect.y1;
}

/**
 * Split a given rectangle vertically into two rectangles, according to the
 * desired ratio.
 *
 * @param {Rect} rect - The rectangle to split
 * @returns {[Rect, Rect]} - Two sub-rectangles
 */
export function vsplit(rect, frac) {
  let ySplit = rect.y1 + frac * height(rect);
  return [{ ...rect, y2: ySplit}, {...rect, y1: ySplit}];
}

/**
 * Split a given rectangle horizontally into two rectangles, according to the
 * desired ratio.
 *
 * @param {Rect} rect - The rectangle to split
 * @returns {[Rect, Rect]} - Two sub-rectangles
 */
export function hsplit(rect, frac) {
  let xSplit = rect.x1 + frac * width(rect);
  return [{ ...rect, x2: xSplit }, { ...rect, x1: xSplit }];
}

/**
 * Pad a rectangle with the desired padding
 *
 * @param {Rect} rect - The rectangle to pad
 * @param {number} padding - The desired padding
 * @returns {Rect} The padded rectangle
 */
export function pad(rect, padding) {
  return {
    x1: rect.x1 + padding,
    y1: rect.y1 + padding,
    x2: rect.x2 - padding,
    y2: rect.y2 - padding,
  };
}

/**
 * Get the center of a rect
 *
 * @param {Rect} rect - The rectangle
 * @return {{x: number, y: number}} The coordinates of the rectangle center
 */
export function center(rect) {
  return {
    x: (rect.x2 + rect.x1) / 2,
    y: (rect.y2 + rect.y1) / 2,
  };
}

/**
 * Clamp a given value between the desired min/max
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
export function clamp(value, min, max) {
  return Math.max(Math.min(value, max), min);
}
