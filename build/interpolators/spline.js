'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sign = require('babel-runtime/core-js/math/sign');

var _sign2 = _interopRequireDefault(_sign);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A 2D constrained spline interpolator.
 * For a 4x4 grid of samples, this allows us to calculate interpolated values between the central four samples.
 * By pre-fitting the curves in one dimension (y) and proceeding with the interpolation row by row,
 * we re-use most of the computation from one output pixel to the next.
 *
 * Polynomial (e.g. bicubic) interpolation is prone to oscillation and overshoot.
 * Splines are better behaved but can still overshoot. We can sacrifice smoothness and add a no-overshoot constraint.    * See: http://www.korf.co.uk/spline.pdf
 * Kruger, CJC. Constrained Cubic Spline Interpolation for Chemical Engineering Applications.
 */
var SplineInterpolator = function SplineInterpolator(grid, gridX, gridY) {
  // First, find grid coordinates for the sixteen cells.
  // The patch extends one cell east and south of the specified grid position, but uses 16 cells in the grid.
  // We deal with the edges of the input grid by duplicating adjacent values.
  // It's tempting to do this with typed arrays and slice(), but we need special handling for those grid edges.

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
  var columnInterpolator0 = ConstraintedSplineInterpolator(p00, p01, p02, p03);
  var columnInterpolator1 = ConstraintedSplineInterpolator(p10, p11, p12, p13);
  var columnInterpolator2 = ConstraintedSplineInterpolator(p20, p21, p22, p23);
  var columnInterpolator3 = ConstraintedSplineInterpolator(p30, p31, p32, p33);

  return function (yFraction) {
    // Perform curve fitting in the second (x) dimension based on the pre-fit curves in the y dimension.
    var p0 = columnInterpolator0(yFraction);
    var p1 = columnInterpolator1(yFraction);
    var p2 = columnInterpolator2(yFraction);
    var p3 = columnInterpolator3(yFraction);
    // Return the one-dimensional interpolator for this row.
    return ConstraintedSplineInterpolator(p0, p1, p2, p3);
  };
};
SplineInterpolator.gridOffset = 0.5;
exports.default = SplineInterpolator;

/**
 * Given four adjacent values a, b, c, d, fit a constrained cubic spline to them,
 * sacrificing smoothness to prevent overshoot.
 * The returned function provides interpolated values between b and c using a and d to
 * determine the slope going into and out of the b-c interval.
 * The original paper handles the general case where data points are (x,y) pairs.
 * In our case, the four points are always evenly spaced, so we assign X coordinates of
 * -1, 0, 1, 2 knowing we will perform interpolation between the second and third points.
 * This greatly simplifies the equations, because it gives many differences, multipliers,
 * and denominators have a value of 1.
 */

var ConstraintedSplineInterpolator = function ConstraintedSplineInterpolator(a, b, c, d) {
  // Optimization: if b and c are equal, interpolate a straight line
  if (b === c) return function (x) {
    return b;
  };
  var bSlope = slope(a, b, c);
  var cSlope = slope(b, c, d);
  var bSlope2 = -(2 * cSlope + 4 * bSlope) + 6 * (c - b); // equation 8
  var cSlope2 = +(4 * cSlope + 2 * bSlope) - 6 * (c - b); // equation 9
  var kd = (cSlope2 - bSlope2) / 6; // equation 10
  var kc = bSlope2 / 2; // equation 11
  var kb = c - b - kc - kd; // equation 12
  var ka = b; // equation 13
  // The returned function takes an x value in [0, 1] expressing the position between b and c,
  // and returns the interpolated value.
  return function (x) {
    return ka + kb * x + kc * Math.pow(x, 2) + kd * Math.pow(x, 3);
  };
};

/**
 * This function implements equation 7a from the original constrained spline interpolation paper.
 * It finds the target slope at a particular data point. y here is the same as y sub i in the equations in the paper.
 * yPrev here is y sub i-1 and yNext here is y sub i+1.
 * The equations are simplified significantly by the fact that we know all of our points are exactly one unit apart.
 * We don't have a separate equation for slope at the endpoints (which requries recursively computing slopes).
 * Instead we just duplicate the values at the edge of the grid.
 */
var slope = function slope(yPrev, y, yNext) {
  var prevSlope = y - yPrev;
  var postSlope = yNext - y;
  if (prevSlope === 0 || postSlope === 0) return 0; // necessary condition for no overshoot
  if ((0, _sign2.default)(prevSlope) !== (0, _sign2.default)(postSlope)) return 0; // includes case where only one slope is zero
  return 2 / (1 / postSlope + 1 / prevSlope);
};
module.exports = exports['default'];

//# sourceMappingURL=spline.js