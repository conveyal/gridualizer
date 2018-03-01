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

var _choropleth = require('../choropleth');

var _choropleth2 = _interopRequireDefault(_choropleth);

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
          breaks = _props.breaks,
          colors = _props.colors,
          labels = _props.labels;

      this.leafletElement = new _choropleth2.default(grid, breaks, colors, labels);
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps) {
      var _props2 = this.props,
          grid = _props2.grid,
          breaks = _props2.breaks,
          colors = _props2.colors;

      // deep equal the colors

      var colorsEqual = colors === nextProps.colors;

      if (!colorsEqual && colors != null && nextProps.colors != null) {
        if (colors.length === nextProps.colors.length) {
          // if we find no colors that don't equal each other, set colorsEqual=true
          // colorsEqual is already false
          colorsEqual = colors.find(function (c, i) {
            return colors[i] !== nextProps.colors[i];
          }) === undefined;
        }
      }

      return grid !== nextProps.grid || breaks !== nextProps.breaks || !colorsEqual;
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      this.layerContainer.removeLayer(this.leafletElement);
      var _props3 = this.props,
          grid = _props3.grid,
          breaks = _props3.breaks,
          colors = _props3.colors,
          labels = _props3.labels;

      this.leafletElement = new _choropleth2.default(grid, breaks, colors, labels);
      this.layerContainer.addLayer(this.leafletElement);
    }
  }]);
  return ReactChoropleth;
}(_reactLeaflet.MapLayer); /** React-leaflet component for a choropleth map */

ReactChoropleth.propTypes = {
  grid: _react.PropTypes.object.isRequired,
  breaks: _react.PropTypes.func,
  colors: _react.PropTypes.array,
  labels: _react.PropTypes.number
};
exports.default = ReactChoropleth;
module.exports = exports['default'];

//# sourceMappingURL=choropleth.js