'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _xorshift = require('xorshift');

var _ckmeans = require('simple-statistics/src/ckmeans');

var _ckmeans2 = _interopRequireDefault(_ckmeans);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Tom McWright did some punch-card archaeology to reimplement the Jenks Breaks method
 * in his simple-statistics library. This Ckmeans method supersedes the Jenks method,
 * especially since Ckmenas 3.4.6 improves runtime from O(kn^2) to O(kn log(n)).
 * https://simplestatistics.org/docs/#ckmeans
 */
var ckmeans = function ckmeans(_ref) {
  var _ref$noDataValue = _ref.noDataValue,
      noDataValue = _ref$noDataValue === undefined ? null : _ref$noDataValue;
  return function (grid, nBreaks) {
    // On big data sets, cluster a random sample of the data to keep run time reasonable.
    var maxLength = 10000;
    // Filtering out the zeros seems to give more nuanced breaks. There are a huge amount of zeros.
    var filtered = grid.data.filter(function (i) {
      return i !== 0 && i !== noDataValue;
    });
    if (filtered.length > maxLength) {
      var sample = new Int32Array(maxLength);
      var generator = new _xorshift.constructor([grid.west, grid.north, grid.width, grid.height]);
      for (var i = 0; i < maxLength; i++) {
        sample[i] = filtered[generator.random() * filtered.length | 0];
      }
      filtered = sample;
    }
    var clusters = (0, _ckmeans2.default)(filtered, nBreaks);
    var breaks = [];
    for (var _i = 0; _i < nBreaks; _i++) {
      var cluster = clusters[_i];
      breaks[_i] = cluster[cluster.length - 1];
    }
    return breaks;
  };
};

exports.default = ckmeans;
module.exports = exports['default'];

//# sourceMappingURL=ckmeans.js