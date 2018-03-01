'use strict';

var _quantile = require('../quantile');

var _quantile2 = _interopRequireDefault(_quantile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('classifiers > quantile', function () {
  it('should work', function () {
    var data = new Int32Array(1000);
    // spread into 10 classes evenly
    for (var i = 0; i < data.length; i++) {
      data[i] = i % 10;
    }expect((0, _quantile2.default)({})({ data: data, min: 0, max: 9 }, 5)).toEqual([2, 4, 6, 8, 9]);
  });

  it('should handle no data value', function () {
    var data = new Int32Array(1000);
    // spread into 5 classes evenly
    for (var i = 0; i < data.length; i++) {
      data[i] = i % 5;
    } // 3, 4 because 4 is the max, and there are as many values < 3 as there are >= 3, because 2 is excluded
    expect((0, _quantile2.default)({ noDataValue: 2 })({ data: data, min: 0, max: 4 }, 2)).toEqual([3, 4]);
  });
}); /* global describe, it, expect */

//# sourceMappingURL=quantile.js