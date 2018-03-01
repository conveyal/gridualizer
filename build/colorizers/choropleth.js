'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require('../util');

var ChoroplethColorizer = function ChoroplethColorizer(breaks, colors) {
  var clampTo = breaks[breaks.length - 1];
  colors = (0, _util.normalizeColors)(colors);
  return function (value) {
    if (value > clampTo) value = clampTo;
    for (var i = 0; i < breaks.length; i++) {
      var z = breaks[i];
      if (value <= z) return colors[i];
    }
  };
};

exports.default = ChoroplethColorizer;
module.exports = exports['default'];

//# sourceMappingURL=choropleth.js