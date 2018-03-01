'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require('../util');

/**
 * A bilinear interpolation patch for a 2x2 grid of samples.
 * Lines are pre-fit in one dimension (y) and interpolation proceeds row by row,
 * re-using most of the computation from one output pixel to the next.
 */
var BilinearInterpolator = function BilinearInterpolator(grid, gridX, gridY) {
  // Get a patch extending one cell east and south of the given grid location.
  var upperLeft = (0, _util.getGridValue)(grid, gridX + 0, gridY + 0);
  var lowerLeft = (0, _util.getGridValue)(grid, gridX + 0, gridY + 1);
  var upperRight = (0, _util.getGridValue)(grid, gridX + 1, gridY + 0);
  var lowerRight = (0, _util.getGridValue)(grid, gridX + 1, gridY + 1);
  // Store enough information to interpolate along the left and right edges of the 2x2 box
  var leftIntercept = upperLeft;
  var leftRise = lowerLeft - upperLeft;
  var rightIntercept = upperRight;
  var rightRise = lowerRight - upperRight;
  // For a given y position inside the patch in [0, 1],
  // The bilinear interpolator returns a 1D interpolator for that single row.
  return function (yFraction) {
    // Fit a line in the second dimension (x) based on the pre-fit curves in the y dimension.
    var left = leftIntercept + leftRise * yFraction;
    var right = rightIntercept + rightRise * yFraction;
    var rowIntercept = left;
    var rowRise = right - left;
    // return a 1D linear interpolator for a single row.
    return function (xFraction) {
      return rowIntercept + rowRise * xFraction;
    };
  };
};
BilinearInterpolator.gridOffset = 0.5;
exports.default = BilinearInterpolator;

// TODO optimization
//        // Do not bother calculating cell if all corners are zero.
//        if (upperLeft === upperRight === lowerLeft === lowerRight)
//           this.getInterpolatedValue = () -> {return upperLeft}
// Could also skip entire patches, drawing nothing into the tile.

module.exports = exports['default'];

//# sourceMappingURL=bilinear.js