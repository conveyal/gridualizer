'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _choropleth = require('./choropleth.js');

var _choropleth2 = _interopRequireDefault(_choropleth);

var _dither = require('./dither.js');

var _dither2 = _interopRequireDefault(_dither);

var _dot = require('./dot.js');

var _dot2 = _interopRequireDefault(_dot);

var _gradient = require('./gradient.js');

var _gradient2 = _interopRequireDefault(_gradient);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = { choropleth: _choropleth2.default, dither: _dither2.default, dot: _dot2.default, gradient: _gradient2.default };
module.exports = exports['default'];

//# sourceMappingURL=index.js