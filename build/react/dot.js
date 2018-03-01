'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _dot = require('../dot');

var _dot2 = _interopRequireDefault(_dot);

var _reactLeaflet = require('react-leaflet');

var _react = require('react');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ReactChoropleth = function (_MapLayer) {
  (0, _inherits3.default)(ReactChoropleth, _MapLayer);

  function ReactChoropleth() {
    (0, _classCallCheck3.default)(this, ReactChoropleth);
    return (0, _possibleConstructorReturn3.default)(this, (ReactChoropleth.__proto__ || (0, _getPrototypeOf2.default)(ReactChoropleth)).apply(this, arguments));
  }

  (0, _createClass3.default)(ReactChoropleth, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      (0, _get3.default)(ReactChoropleth.prototype.__proto__ || (0, _getPrototypeOf2.default)(ReactChoropleth.prototype), 'componentWillMount', this).call(this);
      var _props = this.props,
          grid = _props.grid,
          placement = _props.placement,
          color = _props.color;

      this.leafletElement = new _dot2.default(grid, color, placement);
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps) {
      var _props2 = this.props,
          grid = _props2.grid,
          placement = _props2.placement,
          color = _props2.color;

      return grid !== nextProps.grid || placement !== nextProps.placement || color !== nextProps.color;
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      this.layerContainer.removeLayer(this.leafletElement);
      var _props3 = this.props,
          grid = _props3.grid,
          placement = _props3.placement,
          color = _props3.color;

      this.leafletElement = new _dot2.default(grid, color, placement);
      this.layerContainer.addLayer(this.leafletElement);
    }
  }]);
  return ReactChoropleth;
}(_reactLeaflet.MapLayer); /** React-leaflet component for a choropleth map */

ReactChoropleth.propTypes = {
  grid: _react.PropTypes.object.isRequired,
  placement: _react.PropTypes.func,
  color: _react.PropTypes.string
};
exports.default = ReactChoropleth;
module.exports = exports['default'];

//# sourceMappingURL=dot.js