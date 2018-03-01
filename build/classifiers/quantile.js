'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _xorshift = require('xorshift');

/** A quantile classifier. Pass in an optional no data value */
var quantile = function quantile(_ref) {
  var _ref$noDataValue = _ref.noDataValue,
      noDataValue = _ref$noDataValue === undefined ? null : _ref$noDataValue;
  return function (grid, nBreaks) {
    var sample = void 0;
    // Use a sample to make the algorithm tractable. Thanks to the central limit theorem this should
    // be fine.
    if (grid.data.length < 10000) {
      sample = grid.data.slice(0);
    } else {
      sample = new Int32Array(10000);
      var generator = new _xorshift.constructor([grid.west, grid.north, grid.width, grid.height]);
      for (var i = 0; i < 10000; i++) {
        sample[i] = grid.data[generator.random() * grid.data.length | 0];
      }
    }
    sample = sample.filter(function (i) {
      return i !== noDataValue;
    });
    sample.sort();
    sample.slice(50, 950);
    var step = sample.length / nBreaks | 0;
    var breaks = [];
    for (var _i = 0; _i < nBreaks - 1; _i++) {
      breaks.push(sample[step * (_i + 1)]);
    }
    // make sure we don't cut any off at the top
    breaks.push(grid.max);
    return breaks;
  };
};

exports.default = quantile;
module.exports = exports['default'];

//# sourceMappingURL=quantile.js