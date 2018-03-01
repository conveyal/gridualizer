'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _d3Scale = require('d3-scale');

var _range = require('lodash/range');

var _range2 = _interopRequireDefault(_range);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * equal interval classifier, potentially in a space other than the linear
 * Passing in no arguments will use a linear space. you can also pass in
 * a { scale } parameter, which should be a d3 continuous scale with the domain set correctly.
 *
 * The 'interface' of a classifier is (grid, nBreaks) to an array of break points.
 * We don't want to pass the scale into the classifier itself (only when constructing the classifier) because
 * applying a scale to other classifier types (e.g. quantile) has no effect. We also don't want to completely
 * transform the input data, just temporarily apply the scale while choosing the break points.
 */
var equal = function equal() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      scale = _ref.scale;

  return function (grid, nBreaks) {
    // copy reference so that it does not persist between calls to thunk
    var localScale = scale;
    if (localScale == null) {
      localScale = (0, _d3Scale.scaleLinear)().domain([grid.min, grid.max]);
    }

    // we set the range to determine the classes, and then we invert the scale to find where the breakpoints are
    localScale.range([0, nBreaks]);
    return (0, _range2.default)(1, nBreaks + 1).map(function (b) {
      return localScale.invert(b);
    });
  };
};

exports.default = equal;
module.exports = exports['default'];

//# sourceMappingURL=equal-interval.js