'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _objectWithoutProperties2 = require('babel-runtime/helpers/objectWithoutProperties');

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _equalInterval = require('./equal-interval');

var _equalInterval2 = _interopRequireDefault(_equalInterval);

var _range = require('lodash/range');

var _range2 = _interopRequireDefault(_range);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a diverging classifier from any other classifier,
 * set scheme to the other classifier.
 * If the center is not zero, specify the center parameter.
 * If the classifier you are using requires other options, pass them in as well.
 */
/** Create a diverging scale from another scale */

var diverging = function diverging() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var _ref$scheme = _ref.scheme,
      scheme = _ref$scheme === undefined ? _equalInterval2.default : _ref$scheme,
      _ref$center = _ref.center,
      center = _ref$center === undefined ? 0 : _ref$center,
      opts = (0, _objectWithoutProperties3.default)(_ref, ['scheme', 'center']);
  return function (grid, nBreaks) {
    if (nBreaks % 2 === 0) nBreaks--; // we need an odd number of clases

    var breaksPerSide = (nBreaks + 1) / 2;

    var dataBelow = grid.data.filter(function (i) {
      return i < center;
    });
    var dataAbove = grid.data.filter(function (i) {
      return i > center;
    });

    var classifier = scheme(opts);
    var breaksBelow = dataBelow.length > 0 ? classifier((0, _extends3.default)({}, grid, { data: dataBelow, max: Math.min(grid.max, center) }), breaksPerSide).slice(0, breaksPerSide - 1) : (0, _range2.default)(breaksPerSide - 1).map(function (i) {
      return center;
    });
    var breaksAbove = dataAbove.length > 0 ? classifier((0, _extends3.default)({}, grid, { data: dataAbove, min: Math.max(grid.min, center) }), breaksPerSide) : (0, _range2.default)(breaksPerSide).map(function (i) {
      return center;
    });

    return [].concat((0, _toConsumableArray3.default)(breaksBelow), (0, _toConsumableArray3.default)(breaksAbove));
  };
};

exports.default = diverging;
module.exports = exports['default'];

//# sourceMappingURL=diverging.js