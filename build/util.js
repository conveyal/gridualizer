'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

exports.getGridValue = getGridValue;
exports.normalizeColors = normalizeColors;
exports.getGridPercentiles = getGridPercentiles;
exports.getTrimmedMax = getTrimmedMax;
exports.getTrimmedMax2 = getTrimmedMax2;
exports.getTrimmedMax3 = getTrimmedMax3;
exports.drawDot = drawDot;

var _d3Color = require('d3-color');

var _xorshift = require('xorshift');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This module contains library functions reused throughout the project.
 */

/**
 * Return the value of an opportunity density grid cell.
 * Range check and return 0 for cells outside the grid.
 * TODO This should really be in the Grid class, and grids should have a default value for empty cells.
 * Alternatively, we could inject this into the grid object itself but that might be bad form.
 */
function getGridValue(grid, gx, gy) {
  if (gx < 0 || gx >= grid.width || gy < 0 || gy >= grid.height) return 0;
  // Convert grid x and y cell coordinates to a 1D offset into the grid.
  // This is a good place to apply log or sqrt transformations if needed.
  return grid.data[gy * grid.width + gx];
}

/**
 * Convert an array of colors where each color is a D3 color string, an [r, g, b] array, or an [r, g, b, a] array
 * fractional or integer alpha to an array of [r, g, b, a] arrays with integer alpha,
 * which is what we write directly into output pixels.
 */
function normalizeColors(colors) {
  return colors.map(function (c) {
    if (Array.isArray(c)) {
      // Add alpha if it's missing
      if (c.length === 3) c.push(255);
    } else {
      // Color is not an array, treat it as a D3 color specification
      c = (0, _d3Color.color)(c).rgb();
      c = [c.r, c.g, c.b, c.opacity];
    }
    // At this point, c should always be an array of four numbers.
    // Convert floating point alpha to in integer if needed.
    if (c[3] < 1) c[3] = Math.floor(c[3] *= 255);
    return c;
  });
}

/**
 * Given a Grid, return an array of 100 quantiles of the non-zero, non-missing values in that Grid.
 */
function getGridPercentiles(grid) {
  var MAX_SIZE = 10000; // Actually this runs pretty fast even with 160k elements
  var noDataValue = null;
  var cleanedData = grid.data.filter(function (i) {
    return i > 0 && i !== noDataValue;
  });
  if (cleanedData.length > MAX_SIZE) {
    var sample = new Int32Array(MAX_SIZE);
    // Initialize the random number generator with the grid's characteristics to make results reproducible
    var generator = new _xorshift.constructor([grid.west, grid.north, grid.width, grid.height]);
    for (var i = 0; i < MAX_SIZE; i++) {
      sample[i] = cleanedData[generator.random() * cleanedData.length | 0];
    }
    cleanedData = sample;
  }
  cleanedData.sort();
  var step = cleanedData.length / 100.0;
  var percentiles = [];
  for (var p = 0; p < 101; p++) {
    percentiles[p] = cleanedData[step * p | 0];
  }
  return percentiles;
}

// Get the 99th percentile of all the _unique_ values in the grid.
// There are a huge amouunt of zeros, ones, twos etc. so most approaches using percentiles to transform the data
// remap all of the interesting data up near 1.0, creating an almost solid-filled plot.
function getTrimmedMax(grid) {
  var distinct = Int32Array.from(new _set2.default(grid.data));
  distinct.sort();
  return distinct[distinct.length * 0.99 | 0];
}

// Attempt to remove outliers by repeatedly finding the maximum of random samples of the data.
// The typical 1.5x interquartile range approach is not effective because density is not normally distributed.
function getTrimmedMax2(grid) {
  var noDataValue = null;
  var cleanedData = grid.data.filter(function (i) {
    return i > 0 && i !== noDataValue;
  });
  cleanedData.sort();
  var generator = new _xorshift.constructor([grid.west, grid.north, grid.width, grid.height]);
  var maxes = [];
  for (var i = 0; i < 15; i++) {
    var max = 0;
    for (var s = 0; s < 10000; s++) {
      var x = cleanedData[generator.random() * cleanedData.length | 0];
      if (x > max) max = x;
    }
    maxes.push(max);
  }
  maxes.sort();
  var medianMax = maxes[maxes.length / 2 | 0];
  return medianMax;
}

// Find the 99th percentile of all the grid data not near zero.
// Requires magic numbers (minimum density) to get good results where there are lots of small-valued cells.
function getTrimmedMax3(grid) {
  var MIN_DENSITY = 50;
  var noDataValue = null;
  var cleanedData = grid.data.filter(function (i) {
    return i > MIN_DENSITY && i !== noDataValue;
  });
  cleanedData.sort();
  return cleanedData[cleanedData.length * 0.99 | 0];
}

/**
 * This will draw one dot into the imageData, as a square with the given width.
 * If you set width to a number that increases by powers of 2 with the zoom level, this gives the illusion of
 * dots of a fixed geographic size. For example, width = (zoom - 12) ** 2.
 * The problem is that at least with our current method these dots jump around when you zoom (random placement)
 * and the dots are rendered to a single tile in isolation, so dots are clipped at the edge of tiles.
 */
function drawDot(imgData, x, y, width, color) {
  // Resulting color has some opacity, write it into the tile
  for (var dy = 0; dy < width; dy++) {
    if (y + dy > 255) break;
    for (var dx = 0; dx < width; dx++) {
      if (x + dx > 255) continue;
      var imgOffset = ((y + dy) * 256 + x + dx) * 4;
      imgData.data.set(color, imgOffset);
    }
  }
}

//# sourceMappingURL=util.js