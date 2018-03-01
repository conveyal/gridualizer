'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require('../util');

/**
 * A nearest-neighbor interpolation patch for a 2x2 grid of samples.
 * This just returns a constant value from the upper left corner of the patch.
 * The nested functions are just to be coherent with the other interpolators, which work row by row.
 */
var NearestNeighborInterpolator = function NearestNeighborInterpolator(grid, gridX, gridY) {
  var z = (0, _util.getGridValue)(grid, gridX, gridY);
  return function (yFraction) {
    return function (xFraction) {
      return z;
    };
  };
};
NearestNeighborInterpolator.gridOffset = 0;
exports.default = NearestNeighborInterpolator;
module.exports = exports['default'];

//# sourceMappingURL=nearest.js