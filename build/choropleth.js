'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

exports.getClassIndex = getClassIndex;

var _leaflet = require('leaflet');

var _color = require('color');

var _color2 = _interopRequireDefault(_color);

var _lodash = require('lodash.range');

var _lodash2 = _interopRequireDefault(_lodash);

var _xorshift = require('xorshift');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** A Leaflet layer for showing a grid as a choropleth map */

var Choropleth = function (_TileLayer$Canvas) {
  (0, _inherits3.default)(Choropleth, _TileLayer$Canvas);

  function Choropleth() {
    (0, _classCallCheck3.default)(this, Choropleth);
    return (0, _possibleConstructorReturn3.default)(this, (Choropleth.__proto__ || (0, _getPrototypeOf2.default)(Choropleth)).apply(this, arguments));
  }

  (0, _createClass3.default)(Choropleth, [{
    key: 'initialize',

    /** Construct with a browsochrones grid object */
    // colors courtesy http://colorbrewer2.org/
    value: function initialize(grid) {
      var breaks = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Choropleth.equal();
      var colors = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'];
      var labels = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 100;

      this.grid = grid;

      this.labels = labels;

      // equal interval
      if (breaks instanceof Array) {
        this.breaks = breaks;
      } else {
        this.breaks = breaks(grid, colors.length);
      }

      this.colors = colors.map(function (c) {
        return new _color2.default(c);
      });
    }
  }, {
    key: 'drawTile',
    value: function drawTile(canvas, _ref, zoom) {
      var x = _ref.x,
          y = _ref.y;

      var ctx = canvas.getContext('2d');
      var imageData = ctx.createImageData(canvas.width, canvas.height);

      // convert to pixels
      x *= 256;
      y *= 256;

      // factor to convert to zoom of grid
      var zoomFactor = Math.pow(2, zoom - this.grid.zoom);

      for (var ty = 0, offset = 0; ty < canvas.height; ty++) {
        for (var tx = 0; tx < canvas.width; tx++, offset += 4) {
          // convert tile coords to web mercator pixels
          var mx = x + tx / canvas.width * 256;
          var my = y + ty / canvas.height * 256;

          // convert zoom level
          mx /= zoomFactor;
          my /= zoomFactor;

          // whole pixel values only, floor
          mx |= 0;
          my |= 0;

          // get grid coords
          var gx = mx - this.grid.west;
          var gy = my - this.grid.north;

          var withinGrid = !(gx < 0 || gx >= this.grid.width || gy < 0 || gy >= this.grid.height);
          var value = withinGrid ? this.grid.data[gy * this.grid.width + gx] : 0;

          var classIdx = getClassIndex(value, this.breaks);

          if (this.colors[classIdx] === undefined) {
            console.log('undefined');
          }

          imageData.data.set([].concat((0, _toConsumableArray3.default)(this.colors[classIdx].rgbArray()), [50]), offset);
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // draw labels if zoom level is high enough
      if (zoom > this.labels) {
        // find contained pixels
        var fromGridX = x / zoomFactor - this.grid.west;
        var toGridX = (x + 256) / zoomFactor - this.grid.west;
        var fromGridY = y / zoomFactor - this.grid.north;
        var toGridY = (y + 256) / zoomFactor - this.grid.north;

        // if we're zoomed in really far and a single grid pixel takes up multiple map tiles, don't
        // label tiles that are not the top-left-most. Since the mercator pixels nest, some tile will
        // line up with the edge of each grid pixel
        if (fromGridX % 1 === 0 && fromGridY % 1 === 0) {
          for (var _gx = fromGridX; _gx < toGridX; _gx++) {
            if (_gx < 0 || _gx >= this.grid.width) continue;
            var _tx = ((_gx + this.grid.west) * zoomFactor - x) / 256 * canvas.width;

            for (var _gy = fromGridY; _gy < toGridY; _gy++) {
              if (_gy < 0 || _gy >= this.grid.height) continue;
              var _ty = ((_gy + this.grid.north) * zoomFactor - y) / 256 * canvas.height;

              ctx.font = '10px sans';
              ctx.fillStyle = 'black';
              ctx.fillText(this.grid.data[_gy * this.grid.width + _gx] + '\n(' + _gx + ', ' + _gy + ')', _tx, _ty + 10);
            }
          }
        }
      }
    }

    /** equal interval classifier */


    /** Quantile classifier */


    /** Equal interval for diverging data, forces middle class to contain zero */

  }]);
  return Choropleth;
}(_leaflet.TileLayer.Canvas);

/**
 * Get the class index based on breaks (breaks[i] is the top of class i).
 * Separate function so that unit tests can be written.
 */


Choropleth.equal = function () {
  return function (grid, nBreaks) {
    var breaks = [];
    var step = (grid.max - grid.min) / nBreaks;
    for (var loc = grid.min + step; loc <= grid.max; loc += step) {
      breaks.push(loc);
    }

    return breaks;
  };
};

Choropleth.quantile = function (_ref2) {
  var _ref2$noDataValue = _ref2.noDataValue,
      noDataValue = _ref2$noDataValue === undefined ? null : _ref2$noDataValue;
  return function (grid, nBreaks) {
    var sample = void 0;

    // Use a sample to make the algorithm tractable. Thanks to the central limit theorem this should
    // be fine.
    if (grid.data.length < 10000) {
      sample = grid.data.slice(0);
    } else {
      sample = new Int32Array(10000);
      var generator = new _xorshift.constructor([grid.west, grid.north, grid.width, grid.height]);

      for (var i = 0; i < 10000; i++) {
        sample[i] = grid.data[generator.random() * grid.data.length | 0];
      }
    }

    sample = sample.filter(function (i) {
      return i !== noDataValue;
    });
    sample.sort();

    var step = sample.length / nBreaks | 0;

    var breaks = [];

    for (var _i = 0; _i < nBreaks - 1; _i++) {
      breaks.push(sample[step * (_i + 1)]);
    }

    // make sure we don't cut any off at the top
    breaks.push(grid.max);

    return breaks;
  };
};

Choropleth.equalDiverging = function () {
  return function (grid, nBreaks) {
    if (nBreaks % 2 === 0) nBreaks--; // we need an odd number of clases, subtract so we don't run off the end of the color scale

    var breaksPerSide = (nBreaks + 1) / 2;

    var breaks = [];

    // make the breaks below zero
    var step = (0 - grid.min) / breaksPerSide;

    if (step <= 0) {
      // -1 because we don't include the top break from the lower half (the middle class is the
      // merger of the top class from the lower half and the bottom class from the upper)
      for (var i = 0; i < breaksPerSide - 1; i++) {
        breaks.push(0);
      }
    } else {
      for (var loc = grid.min + step; loc < 0; loc += step) {
        breaks.push(loc);
      }
    }

    step = grid.max / breaksPerSide;

    if (step <= 0) {
      for (var _i2 = 0; _i2 < breaksPerSide; _i2++) {
        breaks.push(0);
      }
    } else {
      for (var _loc = step; _loc < grid.max; _loc += step) {
        breaks.push(_loc);
      }
    }

    return breaks;
  };
};

Choropleth.quantileDiverging = function (_ref3) {
  var noDataValue = _ref3.noDataValue;
  return function (grid, nBreaks) {
    if (nBreaks % 2 === 0) nBreaks--; // we need an odd number of clases

    var breaksPerSide = (nBreaks + 1) / 2;

    var dataBelow = grid.data.filter(function (i) {
      return i < 0;
    });
    var dataAbove = grid.data.filter(function (i) {
      return i > 0;
    });

    var classifier = Choropleth.quantile({ noDataValue: noDataValue });
    var breaksBelow = dataBelow.length > 0 ? classifier((0, _extends3.default)({}, grid, { data: dataBelow }), breaksPerSide).slice(0, breaksPerSide - 1) : (0, _lodash2.default)(breaksPerSide - 1).map(function (i) {
      return 0;
    });
    var breaksAbove = dataAbove.length > 0 ? classifier((0, _extends3.default)({}, grid, { data: dataAbove }), breaksPerSide) : (0, _lodash2.default)(breaksPerSide).map(function (i) {
      return 0;
    });

    return [].concat((0, _toConsumableArray3.default)(breaksBelow), (0, _toConsumableArray3.default)(breaksAbove));
  };
};

exports.default = Choropleth;
function getClassIndex(value, breaks) {
  // increment the class index until we get to the end of the array or the previous break is smaller
  // than the value
  var classIdx = 0;
  while (classIdx < breaks.length - 1 && breaks[classIdx] < value) {
    classIdx++;
  }return classIdx;
}

//# sourceMappingURL=choropleth.js