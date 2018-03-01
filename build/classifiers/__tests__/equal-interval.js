'use strict';

var _d3Scale = require('d3-scale');

var _range = require('lodash/range');

var _range2 = _interopRequireDefault(_range);

var _equalInterval = require('../equal-interval');

var _equalInterval2 = _interopRequireDefault(_equalInterval);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mockGrid = {
  min: 0,
  max: 1000,
  data: (0, _range2.default)(0, 1001)
}; /* global describe, it, expect */

describe('classifiers > equal-interval', function () {
  it('should handle a linear classifier', function () {
    expect((0, _equalInterval2.default)()(mockGrid, 5)).toMatchSnapshot();
  });

  it('should handle a nonlinear classifier', function () {
    var scale = (0, _d3Scale.scaleLog)().domain([1, 1000]).clamp(true);

    expect((0, _equalInterval2.default)({ scale: scale })(mockGrid, 5)).toMatchSnapshot();
  });
});

//# sourceMappingURL=equal-interval.js