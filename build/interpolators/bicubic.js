'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require('../util');

/**
 * A pre-calculated bicubic interpolation patch.
 * For a 4x4 grid of samples, this allows us to calculate interpolated values between the central four samples.
 * By pre-fitting the curves in one dimension (y) and proceeding with the interpolation row by row,
 * we re-use most of the computation from one output pixel to the next.
 */
var BicubicInterpolator = function BicubicInterpolator(grid, gridX, gridY) {
  // First, find grid coordinates for the sixteen cells.
  // Produces a bicubic interpolation patch for a one-cell square.
  // The patch extends one cell east and south of the specified grid position, but uses 16 cells in the grid.

  // Deal with the edges of the input grid by duplicating adjacent values.
  // It's tempting to do this with typed arrays and slice(), but we need special handling for the grid edges.
  var x0 = gridX === 0 ? gridX : gridX - 1; // Handle left edge
  var x1 = gridX;
  var x2 = gridX + 1 >= grid.width ? gridX : gridX + 1; // Handle right edge
  var x3 = gridX + 2 >= grid.width ? gridX : gridX + 2; // Handle right edge

  var y0 = gridY === 0 ? gridY : gridY - 1; // Handle top edge
  var y1 = gridY;
  var y2 = gridY + 1 >= grid.height ? gridY : gridY + 1; // Handle bottom edge
  var y3 = gridY + 2 >= grid.height ? gridY : gridY + 2; // Handle bottom edge

  var p00 = (0, _util.getGridValue)(grid, x0, y0);
  var p01 = (0, _util.getGridValue)(grid, x0, y1);
  var p02 = (0, _util.getGridValue)(grid, x0, y2);
  var p03 = (0, _util.getGridValue)(grid, x0, y3);

  var p10 = (0, _util.getGridValue)(grid, x1, y0);
  var p11 = (0, _util.getGridValue)(grid, x1, y1);
  var p12 = (0, _util.getGridValue)(grid, x1, y2);
  var p13 = (0, _util.getGridValue)(grid, x1, y3);

  var p20 = (0, _util.getGridValue)(grid, x2, y0);
  var p21 = (0, _util.getGridValue)(grid, x2, y1);
  var p22 = (0, _util.getGridValue)(grid, x2, y2);
  var p23 = (0, _util.getGridValue)(grid, x2, y3);

  var p30 = (0, _util.getGridValue)(grid, x3, y0);
  var p31 = (0, _util.getGridValue)(grid, x3, y1);
  var p32 = (0, _util.getGridValue)(grid, x3, y2);
  var p33 = (0, _util.getGridValue)(grid, x3, y3);

  // Create interpolations through each of the four columns
  // Supply an unrolled row-major grid of 16 values (a 4x4 grid).
  // The resulting object can be used to interpolate between the inner four cells.
  // Maybe we should be initializing this with a typed 2D array instead of this mess of individual variables.
  var columnInterpolator0 = CubicHermiteInterpolator(p00, p01, p02, p03);
  var columnInterpolator1 = CubicHermiteInterpolator(p10, p11, p12, p13);
  var columnInterpolator2 = CubicHermiteInterpolator(p20, p21, p22, p23);
  var columnInterpolator3 = CubicHermiteInterpolator(p30, p31, p32, p33);

  return function (yFraction) {
    // Perform curve fitting in the second (x) dimension based on the pre-fit curves in the y dimension.
    var p0 = columnInterpolator0(yFraction);
    var p1 = columnInterpolator1(yFraction);
    var p2 = columnInterpolator2(yFraction);
    var p3 = columnInterpolator3(yFraction);
    // Return the one-dimensional interpolator for this row.
    return CubicHermiteInterpolator(p0, p1, p2, p3);
  };
};
BicubicInterpolator.gridOffset = 0.5;
exports.default = BicubicInterpolator;

/**
 * Given four adjacent values a, b, c, d, fit a curve to them.
 * The returned function provides interpolated values between b and c using a and d to
 * determine the slope going into and out of the b-c interval.
 */

var CubicHermiteInterpolator = function CubicHermiteInterpolator(a, b, c, d) {
  var c3 = -a / 2.0 + 3.0 * b / 2.0 - 3.0 * c / 2.0 + d / 2.0;
  var c2 = a - 5.0 * b / 2.0 + 2.0 * c - d / 2.0;
  var c1 = -a / 2.0 + c / 2.0;
  var c0 = b;
  // This function takes a value in [0, 1] expressing the position between b and c,
  // and returns the interpolated value.
  return function (fraction) {
    return c3 * Math.pow(fraction, 3) + c2 * Math.pow(fraction, 2) + c1 * fraction + c0;
  };
};
module.exports = exports['default'];

//# sourceMappingURL=bicubic.js