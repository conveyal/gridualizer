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

var _gridTileLayer = require('../grid-tile-layer');

var _gridTileLayer2 = _interopRequireDefault(_gridTileLayer);

var _reactLeaflet = require('react-leaflet');

var _react = require('react');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ReactGridMapLayer = function (_MapLayer) {
  (0, _inherits3.default)(ReactGridMapLayer, _MapLayer);

  function ReactGridMapLayer() {
    (0, _classCallCheck3.default)(this, ReactGridMapLayer);
    return (0, _possibleConstructorReturn3.default)(this, (ReactGridMapLayer.__proto__ || (0, _getPrototypeOf2.default)(ReactGridMapLayer)).apply(this, arguments));
  }

  (0, _createClass3.default)(ReactGridMapLayer, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      (0, _get3.default)(ReactGridMapLayer.prototype.__proto__ || (0, _getPrototypeOf2.default)(ReactGridMapLayer.prototype), 'componentWillMount', this).call(this);
      var _props = this.props,
          grid = _props.grid,
          interpolator = _props.interpolator,
          colorizer = _props.colorizer;

      this.leafletElement = new _gridTileLayer2.default(grid, interpolator, colorizer);
    }
    // Interpolator should be a class name, which refers to that class's constructor function

  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps) {
      var _props2 = this.props,
          grid = _props2.grid,
          interpolator = _props2.interpolator,
          colorizer = _props2.colorizer;

      return grid !== nextProps.grid || colorizer !== nextProps.colorizer || interpolator !== nextProps.interpolator;
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      this.layerContainer.removeLayer(this.leafletElement);
      var _props3 = this.props,
          grid = _props3.grid,
          colorizer = _props3.colorizer,
          interpolator = _props3.interpolator;

      this.leafletElement = new _gridTileLayer2.default(grid, interpolator, colorizer);
      this.layerContainer.addLayer(this.leafletElement);
    }
  }]);
  return ReactGridMapLayer;
}(_reactLeaflet.MapLayer); /** React-leaflet component for rendering a Browsochrones Grid as raster map tiles. */

ReactGridMapLayer.propTypes = {
  grid: _react.PropTypes.object.isRequired,
  interpolator: _react.PropTypes.func.isRequired,
  colorizer: _react.PropTypes.func.isRequired
};
exports.default = ReactGridMapLayer;
module.exports = exports['default'];

//# sourceMappingURL=grid-map-layer.js