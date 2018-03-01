'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createDrawTile;

var _nearest = require('./interpolators/nearest');

var _nearest2 = _interopRequireDefault(_nearest);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createDrawTile(_ref) {
  var colorizer = _ref.colorizer,
      grid = _ref.grid,
      interpolator = _ref.interpolator;

  // Find a maximum with outliers trimmed off only when needed, because it can take some time.
  var trimmedMax = colorizer.normalize === true ? (0, _util.getTrimmedMax)(grid) : 0;

  /**
   * Given a web Mercator x, y, and zoom values for a single tile, as well as an associated canvas object,
   * visualize the grid cell counts falling within that tile as colors or dots on the canvas.
   */
  function drawTile(canvas, mercTileCoord, zoom) {
    var canvasContext = canvas.getContext('2d');
    if (!canvasContext) return;

    var imageData = canvasContext.createImageData(canvas.width, canvas.height);

    // Convert web Mercator tile position to pixels relative to the left and the top of the world at its zoom level.
    var mercPixelX = mercTileCoord.x * 256;
    var mercPixelY = mercTileCoord.y * 256;

    // Compute the divisor that will convert pixel (or tile) coordinates at the visual map tile zoom level
    // to pixel (or tile) coordinates at the opportunity density grid's zoom level, i.e. the number of visual map
    // pixels (or tiles) an opportunity grid pixel (or tile) is wide. This is always a power of two,
    // so as an optimization we could just store the difference in zoom levels and scale using bitshift operators.
    // When zoomDifference is non-positive (when we're really zoomed out) tileWidthInGridCells will be > 256 and
    // gridCellWidthInTilePixels will be in (0..1).
    var zoomDifference = zoom - grid.zoom;
    var gridCellWidthInTilePixels = Math.pow(2, zoomDifference);
    var tileWidthInGridCells = 256 / gridCellWidthInTilePixels;
    var tilePixelsPerGridCell = Math.pow(gridCellWidthInTilePixels, 2);

    // The dot colorizer requires its input to be normalized to the range [0..1] and saturates at 1.
    // We don't show one dot per opportunity, we want to show one dot per N opportunities such that the probability
    // of a dot appearing at our trimmedMax value is 1. This simply means dividing the values by the trimmedMax.
    // However, as we zoom in these probabilities that are passed to the dot colorizer remain the same, probabilities
    // in the range [0..1] but an increasing number of pixels that may be switched on or off fall within each grid cell.
    // So as we zoom in and the resolution increases, each dot represents a smaller and smaller number of opportunities.
    // At some zoom level, dependent on the trimmedMax we are normalizing to, a dot will represent less than one
    // opportunity. This is undesirable because it can give the impression that some category of opportunities is very
    // prevalent on the map when in fact it's just uniformly scarce.
    // We want to hold the divisor ("dilutionFactor") constant at trimmedMax to create the visual impression that as
    // we zoom in, dot density remains constant over a given geographic area. What we are effectively doing is
    // dividing the raw interpolated density by the number of opportunities per dot, then by the number
    // of pixels within a grid cell at the current zoom level to spread the probability over many pixels.
    //   density / dilutionFactor
    // = density / opportunitiesPerDot / tilePixelsPerGridCell
    // = density / (opportunitiesPerDot * tilePixelsPerGridCell)
    // dilutionFactor = opportunitiesPerDot * tilePixelsPerGridCell
    // opportunitiesPerDot = dilutionFactor / tilePixelsPerGridCell ; opportunitiesPerDot >= 1
    // dilutionFactor / tilePixelsPerGridCell >= 1
    // dilutionFactor >= tilePixelsPerGridCell
    var dilutionFactor = trimmedMax;
    // Force implicit opportunitiesPerDot >= 1
    if (dilutionFactor < tilePixelsPerGridCell) dilutionFactor = tilePixelsPerGridCell;

    // Fall back on nearest neighbor when each grid cell covers one or less tile pixels.
    // Also when each tile covers a fraction of a grid cell.
    var finalInterpolator = interpolator === null || zoomDifference <= 1 || zoomDifference > 8 ? _nearest2.default : interpolator;

    // Find the range of grid cells that contribute to the contents of the map tile we're rendering.
    // Most interpolators consider the grid cell value to be at the center of the cell,
    // so we need to hit one extra row of cells outside the tile.
    var gridOffset = finalInterpolator.gridOffset;
    var gxMin = Math.floor(mercPixelX / gridCellWidthInTilePixels - grid.west - gridOffset);
    var gyMin = Math.floor(mercPixelY / gridCellWidthInTilePixels - grid.north - gridOffset);
    var gxMax = Math.ceil(gxMin + tileWidthInGridCells + gridOffset);
    var gyMax = Math.ceil(gyMin + tileWidthInGridCells + gridOffset);

    // When zoomed far enough out, we can skip over some grid cells.
    var gridStep = 1;
    if (zoomDifference < 0) gridStep = Math.pow(2, -zoomDifference);

    // Iterate over all opportunity grid pixels that contribute to the contents of the map tile we're rendering.
    // Due to the fact that mercator grid zoom level sizes are powers of two, when multiple opportunity grid
    // cells fall within a map tile there are always an integer number of them and no partial overlaps.
    // But for interpolation purposes, we work on boxes that are offset 1/2 cell to the east and south because
    // we consider grid cell values to be at the center (rather than the corner) of those cells.
    // FIXME maybe we should be adding half the gridStep to use the grid cell in the center of the range.
    for (var gx = gxMin; gx < gxMax; gx += gridStep) {
      for (var gy = gyMin; gy < gyMax; gy += gridStep) {
        var patch = finalInterpolator(grid, gx | 0, gy | 0);
        // Iterate over all the output tile pixels covered by this patch.
        // These are truncated to integers to handle the case where grid cells are smaller than tile pixels.
        var txMin = (gx - gxMin - gridOffset) * gridCellWidthInTilePixels | 0;
        var tyMin = (gy - gyMin - gridOffset) * gridCellWidthInTilePixels | 0;
        var txMax = Math.ceil(txMin + gridCellWidthInTilePixels) | 0;
        var tyMax = Math.ceil(tyMin + gridCellWidthInTilePixels) | 0;
        for (var ty = tyMin; ty < tyMax; ty++) {
          if (ty < 0 || ty > 255) continue;
          // Todo: refactor to iterate over relative x and y?
          // Get a single-row 1d interpolator function from the 2d interpolator
          var row = patch((ty - tyMin) / gridCellWidthInTilePixels);
          for (var tx = txMin; tx < txMax; tx++) {
            if (tx < 0 || tx > 255) continue;
            // TODO refactor to iterate over relative x and y?
            var interpolatedValue = row((tx - txMin) / gridCellWidthInTilePixels);
            if (colorizer.normalize === true) interpolatedValue /= dilutionFactor;
            var color = colorizer(interpolatedValue);
            if (color[3] !== 0) {
              // Resulting color has some opacity, write it into the tile
              var imgOffset = (ty * 256 + tx) * 4;
              imageData.data.set(color, imgOffset);
            }
          }
        }
      }
    }
    canvasContext.putImageData(imageData, 0, 0);
  }

  return drawTile;
}
module.exports = exports['default'];

//# sourceMappingURL=create-draw-tile.js