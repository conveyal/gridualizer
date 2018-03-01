'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var GradientColorizer = function GradientColorizer(breaks, colors) {
  var clampTo = breaks[breaks.length - 1];
  colors = (0, _util.normalizeColors)(colors);
  // The interpolated color scheme requires one more color "off the end" of the scale
  colors.push(colors[colors.length - 1]);
  return function (value) {
    if (value > clampTo) value = clampTo;
    for (var i = 0; i < breaks.length; i++) {
      var z1 = breaks[i];
      if (value <= z1) {
        var _colors$i = (0, _slicedToArray3.default)(colors[i], 4),
            r0 = _colors$i[0],
            g0 = _colors$i[1],
            b0 = _colors$i[2],
            a0 = _colors$i[3];

        var _colors = (0, _slicedToArray3.default)(colors[i + 1], 4),
            r1 = _colors[0],
            g1 = _colors[1],
            b1 = _colors[2],
            a1 = _colors[3];

        var z0 = i === 0 ? 0 : breaks[i - 1];
        var frac = (value - z0) / (z1 - z0);
        var r = r0 + (r1 - r0) * frac;
        var g = g0 + (g1 - g0) * frac;
        var b = b0 + (b1 - b0) * frac;
        var a = a0 + (a1 - a0) * frac;
        return [r, g, b, a];
      }
    }
  };
};

exports.default = GradientColorizer;
module.exports = exports['default'];

//# sourceMappingURL=gradient.js