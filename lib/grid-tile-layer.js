import {TileLayer} from 'leaflet'
import Color from 'color'

export default class GridTileLayer extends TileLayer.Canvas {
    
  // Visualize a grid of opportunity densities (the class from Browsochrones) as map tiles.
  // Color scale options are:
  // new CutoffColorScale(1000, [0, 0, 0, 0], [...this.color, 128])
  // new DotColorScale(this.color, 4000)
  // new InterpolatingColorScale([[200, 0, 0, 200, 0], [2000, 0, 0, 200, 180], [20000, 150, 0, 0, 180]])
  // Interpolation methods are:
  // BilinearInterpolator, BicubicInterpolator, NearestNeighborInterpolator
  constructor (grid, colorScale, interpolator) {
    super()
    this.grid = grid
    this.colorScale = colorScale
    this.interpolator = interpolator
  }

  // Given a web Mercator x, y, and zoom values for a single tile, as well as an associated canvas object,
  // visualize the opportunities falling within that tile as dots on the canvas.
  drawTile (canvas, mercTileCoord, zoom) {
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(canvas.width, canvas.height)

    // Convert web Mercator tile position to pixels relative to the left and the top of the world at its zoom level.
    const mercPixelX = mercTileCoord.x * 256
    const mercPixelY = mercTileCoord.y * 256

    // Compute the divisor that will convert pixel (or tile) coordinates at the visual map tile zoom level
    // to pixel (or tile) coordinates at the opportunity density grid's zoom level, i.e. the number of visual map
    // pixels (or tiles) an opportunity grid pixel (or tile) is wide.
    // This is always a power of two, so as an optimization we could just store the difference in zoom levels
    // and scale using bitshift operators.
    const zoomDifference = zoom - this.grid.zoom
    // FIXME what happens below when zoomDifference is negative, i.e. when we're really zoomed out?
    const gridCellWidthInTilePixels = Math.pow(2, zoomDifference)
    const tileWidthInGridCells = 256 / gridCellWidthInTilePixels

    // Find the range of grid cells that contribute to the contents of the map tile we're rendering.
    // Most interpolators consider the grid cell value to be at the center of the cell,
    // so we need to hit one extra row of cells outside the tile.
    const tileOffset = this.interpolator.tileOffset
    const gxMin = Math.floor(mercPixelX / gridCellWidthInTilePixels - this.grid.west - tileOffset)
    const gyMin = Math.floor(mercPixelY / gridCellWidthInTilePixels - this.grid.north - tileOffset)
    const gxMax = Math.ceil(gxMin + tileWidthInGridCells + tileOffset)
    const gyMax = Math.ceil(gyMin + tileWidthInGridCells + tileOffset)

    // Iterate over all opportunity grid pixels that contribute to the contents of the map tile we're rendering.
    // Due to the fact that mercator grid zoom level sizes are powers of two,
    // when multiple opportunity grid cells fall within a map tile there are always
    // an integer number of them and no partial overlaps.
    // But for interpolation purposes, we work on boxes that are offset 1/2 cell to the east and south because
    // we consider grid cell values to be at the center (rather than the corner) of those cells.
    for (let gx = gxMin; gx < gxMax; gx++) {
      for (let gy = gyMin; gy < gyMax; gy++) {
        const patch = this.interpolator.forGridPosition(this.grid, gx, gy)
        // Iterate over all the output tile pixels covered by this patch.
        // Possible half-grid-cell offset where the grid cell value is considered to be at the cell's center.
        const txMin = (gx - gxMin - tileOffset) * gridCellWidthInTilePixels
        const tyMin = (gy - gyMin - tileOffset) * gridCellWidthInTilePixels
        const txMax = txMin + gridCellWidthInTilePixels
        const tyMax = tyMin + gridCellWidthInTilePixels
        for (let ty = tyMin; ty < tyMax; ty++) {
          if (ty < 0 || ty > 255) continue
          // Todo: refactor to iterate over relative x and y?
          patch.setFractionY((ty - tyMin) / gridCellWidthInTilePixels) 
          for (let tx = txMin; tx < txMax; tx++) {
            if (tx < 0 || tx > 255) continue
            // TODO refactor to iterate over relative x and y?
            const interpolatedValue = patch.getInterpolatedValue((tx - txMin) / gridCellWidthInTilePixels)              
            const color = this.colorScale.getColorForValue(interpolatedValue)
            if (color[3] != 0) {
              // Resulting color has some opacity, write it into the tile
              const imgOffset = (ty * 256 + tx) * 4
              imageData.data.set(color, imgOffset)
            }
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0)
  }

}