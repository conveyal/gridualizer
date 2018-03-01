'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

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

var _leaflet = require('leaflet');

var _color2 = require('color');

var _color3 = _interopRequireDefault(_color2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Dot density grid, with bilinear interpolation between opportunity density cells and multiple opacity layers
 * for overlappig dots.
 */

var Dot = function (_TileLayer$Canvas) {
  (0, _inherits3.default)(Dot, _TileLayer$Canvas);

  function Dot() {
    (0, _classCallCheck3.default)(this, Dot);
    return (0, _possibleConstructorReturn3.default)(this, (Dot.__proto__ || (0, _getPrototypeOf2.default)(Dot)).apply(this, arguments));
  }

  (0, _createClass3.default)(Dot, [{
    key: 'initialize',

    // grid is the grid of opportunity densities to visualize as map tiles (class from Browsochrones).
    // color is the color of the dots to draw.
    value: function initialize(grid) {
      var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '#49a0d7';

      this.color = new _color3.default(color).rgbArray();
      this.grid = grid;
    }

    // Given a web Mercator x, y, and zoom values for a single tile, as well as an associated canvas object,
    // visualize the opportunities falling within that tile as dots on the canvas.

  }, {
    key: 'drawTile',
    value: function drawTile(canvas, mercTileCoord, zoom) {
      var ctx = canvas.getContext('2d');
      var imageData = ctx.createImageData(canvas.width, canvas.height);

      var _color = (0, _slicedToArray3.default)(this.color, 3),
          red = _color[0],
          green = _color[1],
          blue = _color[2];

      // Convert web Mercator tile position to pixels relative to the left and the top of the world at its zoom level.


      var mercPixelX = mercTileCoord.x * 256;
      var mercPixelY = mercTileCoord.y * 256;

      // Compute the divisor that will convert pixel (or tile) coordinates at the visual map tile zoom level
      // to pixel (or tile) coordinates at the opportunity density grid's zoom level, i.e. the number of visual map
      // pixels (or tiles) an opportunity grid pixel (or tile) is wide.
      // This is always a power of two, so as an optimization we could just store the difference in zoom levels
      // and scale using bitshift operators.
      var zoomDifference = zoom - this.grid.zoom;
      // FIXME what happens below when zoomDifference is negative, i.e. when we're really zoomed out?
      var gridCellWidthInTilePixels = Math.pow(2, zoomDifference);
      var tileWidthInGridCells = 256 / gridCellWidthInTilePixels;
      // The total number of tile pixels falling within one grid cell, i.e. the square of the width in pixels.
      // This is used to convert job counts per cell to job counts per pixel.
      // NOTE that this is instead proportional to the number of pixels in one dimension, which seems to scale better
      // const tilePixelsPerGridCell = gridCellWidthInTilePixels * gridCellWidthInTilePixels * 150
      // const tilePixelsPerGridCell = ZSCALE_BY_ZOOM[zoom] * 500
      var tilePixelsPerGridCell = gridCellWidthInTilePixels * this.grid.max / 200;

      // Find the range of grid cells that contribute to the contents of the map tile we're rendering.
      // When interpolating, we consider the grid cell value to be at the center of the cell,
      // so we need to hit one extra row of cells outside the tile.
      var gxMin = mercPixelX / gridCellWidthInTilePixels - this.grid.west - 1;
      var gyMin = mercPixelY / gridCellWidthInTilePixels - this.grid.north - 1;
      var gxMax = gxMin + tileWidthInGridCells + 1;
      var gyMax = gyMin + tileWidthInGridCells + 1;

      // Iterate over all opportunity grid pixels that contribute to the contents of the map tile we're rendering.
      // Due to the fact that mercator grid zoom level sizes are powers of two,
      // when multiple opportunity grid cells fall within a map tile there are always
      // an integer number of them and no partial overlaps.
      // But for interpolation purposes, we work on boxes that are offset 1/2 cell to the east and south because
      // we consider grid cell values to be at the center (rather than the corner) of those cells.
      for (var gx = gxMin; gx < gxMax; gx++) {
        for (var gy = gyMin; gy < gyMax; gy++) {
          // Get density at the four corners of a box extending one cell east and south of the current cell.
          // These densities are adjusted for the number of pixels in a cell, so they represent the average number of
          // opportunities in a single pixel.
          var upperLeft = this.getGridValue(gx, gy) / tilePixelsPerGridCell;
          var upperRight = this.getGridValue(gx + 1, gy) / tilePixelsPerGridCell;
          var lowerLeft = this.getGridValue(gx, gy + 1) / tilePixelsPerGridCell;
          var lowerRight = this.getGridValue(gx + 1, gy + 1) / tilePixelsPerGridCell;
          // Do not bother rendering cell if all corners are zero.
          if (upperLeft === 0 && upperRight === 0 && lowerLeft === 0 && lowerRight === 0) continue;
          // Determine slopes. Linear interpolation along the left and right edges of the box.
          var leftSlope = (lowerLeft - upperLeft) / gridCellWidthInTilePixels;
          var rightSlope = (lowerRight - upperRight) / gridCellWidthInTilePixels;
          // Iterate over all tile pixels falling within this box
          // Note the half-grid-cell offset because the grid cell value is considered to be at the cell's center.
          var txMin = (gx - gxMin) * gridCellWidthInTilePixels - gridCellWidthInTilePixels / 2;
          var tyMin = (gy - gyMin) * gridCellWidthInTilePixels - gridCellWidthInTilePixels / 2;
          var txMax = txMin + gridCellWidthInTilePixels;
          var tyMax = tyMin + gridCellWidthInTilePixels;
          for (var ty = tyMin; ty < tyMax; ty++) {
            if (ty < 0 || ty > 255) continue;
            // Evaluate the interpolated lines on the left and right edges of the box at this row of pixels.
            // Then interpolate again along the other axis from left to right (bilinear interpolation).
            var left = upperLeft + leftSlope * (ty - tyMin);
            var right = upperRight + rightSlope * (ty - tyMin);
            var rowSlope = (right - left) / gridCellWidthInTilePixels;
            for (var tx = txMin; tx < txMax; tx++) {
              if (tx < 0 || tx > 255) continue;
              var interpolatedDensity = left + rowSlope * (tx - txMin);
              // Get a random number in [0, 1)
              // and plot a dot if that number is less than the number of things in this pixel.
              // We were using a JS Mersenne Twister, which was using 65% of CPU time according to a profiler.
              // Math.random uses an xorshift method in V8, dropping to 4% of CPU time.
              var r = Math.random();
              if (r < interpolatedDensity) {
                var opacity = 64;
                if (r * 2 < interpolatedDensity) opacity += 64;
                if (r * 3 < interpolatedDensity) opacity += 64;
                if (r * 4 < interpolatedDensity) opacity += 63;
                var imgOffset = (ty * 256 + tx) * 4;
                imageData.data.set([red, green, blue, opacity], imgOffset);
              }
            }
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    // Return the value of an opportunity density grid cell.
    // Range check and return 0 for cells outside the grid.

  }, {
    key: 'getGridValue',
    value: function getGridValue(gx, gy) {
      if (gx < 0 || gx >= this.grid.width || gy < 0 || gy >= this.grid.height) return 0;
      // Convert grid x and y cell coordinates to a 1D offset into the grid
      return this.grid.data[gy * this.grid.width + gx];
    }
  }]);
  return Dot;
}(_leaflet.TileLayer.Canvas);

exports.default = Dot;
module.exports = exports['default'];

//# sourceMappingURL=dot.js