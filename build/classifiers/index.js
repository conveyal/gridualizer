'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ckmeans = require('./ckmeans');

var _ckmeans2 = _interopRequireDefault(_ckmeans);

var _diverging = require('./diverging');

var _diverging2 = _interopRequireDefault(_diverging);

var _equalInterval = require('./equal-interval');

var _equalInterval2 = _interopRequireDefault(_equalInterval);

var _quantile = require('./quantile');

var _quantile2 = _interopRequireDefault(_quantile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = { ckmeans: _ckmeans2.default, diverging: _diverging2.default, equal: _equalInterval2.default, quantile: _quantile2.default };
module.exports = exports['default'];

//# sourceMappingURL=index.js