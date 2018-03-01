'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classifiers = require('./classifiers');

var _classifiers2 = _interopRequireDefault(_classifiers);

var _colorizers = require('./colorizers');

var _colorizers2 = _interopRequireDefault(_colorizers);

var _createDrawTile = require('./create-draw-tile');

var _createDrawTile2 = _interopRequireDefault(_createDrawTile);

var _interpolators = require('./interpolators');

var _interpolators2 = _interopRequireDefault(_interpolators);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = { classifiers: _classifiers2.default, colorizers: _colorizers2.default, createDrawTile: _createDrawTile2.default, interpolators: _interpolators2.default };
module.exports = exports['default'];

//# sourceMappingURL=index.js