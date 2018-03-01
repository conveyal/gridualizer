'use strict';

var _diverging = require('../diverging');

var _diverging2 = _interopRequireDefault(_diverging);

var _equalInterval = require('../equal-interval');

var _equalInterval2 = _interopRequireDefault(_equalInterval);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* global describe, it, expect */

describe('classifiers > diverging', function () {
  it('should work', function () {
    var data = new Int32Array(900);
    // yields even dispersion between -4 and +4
    for (var i = 0; i < 900; i++) {
      data[i] = i % 9 - 4;
    }expect((0, _diverging2.default)({
      scheme: _equalInterval2.default,
      center: 0
    })({
      data: data,
      max: 4,
      min: -4
    }, 3)).toEqual([-2, 2, 4]);
  });
});

//# sourceMappingURL=diverging.js