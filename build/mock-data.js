'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mockGrid = undefined;

var _range = require('lodash/range');

var _range2 = _interopRequireDefault(_range);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mockGrid = exports.mockGrid = {
  min: 0,
  max: 1000,
  data: (0, _range2.default)(0, 1001)
};

//# sourceMappingURL=mock-data.js