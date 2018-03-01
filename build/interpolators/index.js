'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bicubic = require('./bicubic');

var _bicubic2 = _interopRequireDefault(_bicubic);

var _bilinear = require('./bilinear');

var _bilinear2 = _interopRequireDefault(_bilinear);

var _nearest = require('./nearest');

var _nearest2 = _interopRequireDefault(_nearest);

var _spline = require('./spline');

var _spline2 = _interopRequireDefault(_spline);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = { bicubic: _bicubic2.default, bilinear: _bilinear2.default, nearest: _nearest2.default, spline: _spline2.default };
module.exports = exports['default'];

//# sourceMappingURL=index.js