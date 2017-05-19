import {TileLayer} from 'leaflet'
import {getGridValue} from './util'
import {getTrimmedMax} from './util'
import nearest from './interpolators/nearest'

/** Visualize a Grid of opportunity densities (the Grid class from Browsochrones) as map tiles. */
export default class GridTileLayer extends TileLayer.Canvas {

  initialize (grid, interpolator, colorizer) {
    this.grid = grid
    this.interpolator = interpolator
    this.colorizer = colorizer
    // Find a maximum with outliers trimmed off only when needed, because it can take some time.
    if (colorizer.normalize === true) this.trimmedMax = getTrimmedMax(grid)
  }

  // Given a web Mercator x, y, and zoom values for a single tile, as well as an associated canvas object,
  // visualize the opportunities falling within that tile as dots on the canvas.
  drawTile (canvas, mercTileCoord, zoom) {
    const canvasContext = canvas.getContext('2d')
    const imageData = canvasContext.createImageData(canvas.width, canvas.height)

    // Convert web Mercator tile position to pixels relative to the left and the top of the world at its zoom level.
    const mercPixelX = mercTileCoord.x * 256
    const mercPixelY = mercTileCoord.y * 256

    // Compute the divisor that will convert pixel (or tile) coordinates at the visual map tile zoom level
    // to pixel (or tile) coordinates at the opportunity density grid's zoom level, i.e. the number of visual map
    // pixels (or tiles) an opportunity grid pixel (or tile) is wide.
    // This is always a power of two, so as an optimization we could just store the difference in zoom levels
    // and scale using bitshift operators.
    const zoomDifference = zoom - this.grid.zoom
    const gridCellWidthInTilePixels = 2 ** zoomDifference 
    const tileWidthInGridCells = 256 / gridCellWidthInTilePixels
    const tilePixelsPerGridCell = gridCellWidthInTilePixels ** 2
    // When zoomDifference is non-positive (when we're really zoomed out) tileWidthInGridCells will be > 256 and
    // gridCellWidthInTilePixels will be < 1.

    // For the dot colorizer which requires inputs to be normalized to the range [0..1] (saturating at 1)
    let dilutionFactor = this.trimmedMax
    // Force implicit opportunitiesPerDot >= 1
    if (dilutionFactor < tilePixelsPerGridCell) dilutionFactor = tilePixelsPerGridCell
            
    // Fall back on nearest neighbor when each grid cell covers one or less tile pixels.
    const interpolator = this.interpolator === null || zoomDifference <= 1 ? nearest : this.interpolator

    // Find the range of grid cells that contribute to the contents of the map tile we're rendering.
    // Most interpolators consider the grid cell value to be at the center of the cell,
    // so we need to hit one extra row of cells outside the tile.
    const gridOffset = this.interpolator.gridOffset
    const gxMin = Math.floor(mercPixelX / gridCellWidthInTilePixels - this.grid.west - gridOffset)
    const gyMin = Math.floor(mercPixelY / gridCellWidthInTilePixels - this.grid.north - gridOffset)
    const gxMax = Math.ceil(gxMin + tileWidthInGridCells + gridOffset)
    const gyMax = Math.ceil(gyMin + tileWidthInGridCells + gridOffset)
    let gridStep = 1
    // When zoomed far enough out, we can skip over some grid cells.
    if (zoomDifference < 0) gridStep = 2 ** Math.abs(zoomDifference)
    // FIXME When zoomed far enough in, we need to proceed by half-tiles.
    // if (zoomDifference > 8) gridStep = 1 / (2 ** (zoomDifference - 8))

    // Iterate over all opportunity grid pixels that contribute to the contents of the map tile we're rendering.
    // Due to the fact that mercator grid zoom level sizes are powers of two,
    // when multiple opportunity grid cells fall within a map tile there are always
    // an integer number of them and no partial overlaps.
    // But for interpolation purposes, we work on boxes that are offset 1/2 cell to the east and south because
    // we consider grid cell values to be at the center (rather than the corner) of those cells.
    // FIXME maybe we should be adding half the gridStep to use the grid cell in the center of the range.
    for (let gx = gxMin; gx < gxMax; gx += gridStep) {
      for (let gy = gyMin; gy < gyMax; gy += gridStep) {
        const patch = interpolator(this.grid, gx | 0, gy | 0)
        // Iterate over all the output tile pixels covered by this patch.
        // These are truncated to integers to handle the case where grid cells are smaller than tile pixels.
        const txMin = ((gx - gxMin - gridOffset) * gridCellWidthInTilePixels) | 0
        const tyMin = ((gy - gyMin - gridOffset) * gridCellWidthInTilePixels) | 0
        const txMax = (txMin + gridCellWidthInTilePixels) | 0
        const tyMax = (tyMin + gridCellWidthInTilePixels) | 0
        for (let ty = tyMin; ty < tyMax; ty++) {
          if (ty < 0 || ty > 255) continue
          // Todo: refactor to iterate over relative x and y?
          // Get a single-row 1d interpolator function from the 2d interpolator
          const row = patch((ty - tyMin) / gridCellWidthInTilePixels)
          for (let tx = txMin; tx < txMax; tx++) {
            if (tx < 0 || tx > 255) continue
            // TODO refactor to iterate over relative x and y?
            let interpolatedValue = row((tx - txMin) / gridCellWidthInTilePixels)
            if (this.colorizer.normalize === true) interpolatedValue /= dilutionFactor
            const color = this.colorizer(interpolatedValue)
            if (color[3] !== 0) {
              // Resulting color has some opacity, write it into the tile
              const imgOffset = (ty * 256 + tx) * 4
              imageData.data.set(color, imgOffset)
            }
          }
        }
      }
    }
    canvasContext.putImageData(imageData, 0, 0)
  }

  // This is too slow to call at every pixel
  getPercentileForValue (value) {
    let p = 0
    while (this.percentiles[p] < value) p++
    return p / 100
  }
    
  /**
   * This will draw one dot into the imageData, as a square with the given width.
   * If you set width to a number that increases by powers of 2 with the zoom level, this gives the illusion of
   * dots of a fixed geographic size. For example, width = (zoom - 12) ** 2.
   * The problem is that at least with our current method these dots jump around when you zoom (random placement)
   * and the dots are rendered to a single tile in isolation, so dots are clipped at the edge of tiles.
   */
  drawDot (imgData, x, y, width, color) {
    // Resulting color has some opacity, write it into the tile
    for (let dy = 0; dy < width; dy++) {
      if (y + dy > 255) break
      for (let dx = 0; dx < width; dx++) {
        if (x + dx > 255) continue
        let imgOffset = ((y + dy) * 256 + x + dx) * 4
        imgData.data.set(color, imgOffset)
      }
    }
  }
  
}

  // Calculate dilution factor if requested, for dot maps.
  // Should also be divided by the number of pixels per grid cell which is (2^(zoom_level_diff + 1))^2
  // We don't increase the size of the dots as we zoom in, so this looks a bit strange, but it's necessary to
  // prevent having a large number of dots visible in a cell with a small number of items.
  // TODO we can compensate for this by choosing people per dot based on zoom level yet constraining to be >= 1
  // At a zoom difference of 8, one grid cell fills one tile pixel (2**8=256) so this is unity for dilution.
  // let peoplePerDot = (2 ** (8 - zoomDifference)) ** 2 // constrain to be >= 1
  // if (peoplePerDot < 1) peoplePerDot = 1
  // const gridCellsInTile = (2 ** (zoomDifference + 1))**2 // FIXME handle fractional values when zoomed out
  // const dilutionFactor = peoplePerDot * tilePixelsPerGridCell
  // Really we should be using percentiles to normalize grid cell values into the 0..1 range, then just checking as
  // we zoom in whether that amounts to <1 person per dot at the given zoom level.
  // const dilutionFactor = 10000
  
  // Our base dilution factor: we want a dot to always appear at the max (or near-max) value.
  // At the zoom level where one grid cell == one tile pixel, this means one dot == the max number of people per cell.
  // As you zoom in beyond this level (which is frequently) the number of pixels that may be colored with a dot per
  // grid cell increases above one. Effectively, dilutionFactor == peoplePerDot * tilePixelsPerGridCell.
  // So dividing the dilutionFactor by tilePixelsPerGridCell tells us the effective number of people per dot.
  // If this ratio falls below 1, we're going to get an unrealistic display.
  // That is to say, we've zoomed in far enough that dots are being used to represent less than one person.
  // Take the interpolated density, divide by the number of opportunities per dot, then divide by the number 
  // of pixels within a grid cell at this zoom level to spread that probability over many pixels.
  //   density / opportunitiesPerDot / tilePixelsPerGridCell 
  // = density / (opportunitiesPerDot * tilePixelsPerGridCell)
  // = density / dilutionFactor;
  //   
  // dilutionFactor = opportunitiesPerDot * tilePixelsPerGridCell ; opportunitiesPerDot >= 1
  // opportunitiesPerDot = dilutionFactor / tilePixelsPerGridCell ; opportunitiesPerDot >= 1
  // dilutionFactor / tilePixelsPerGridCell >= 1
  // dilutionFactor >= tilePixelsPerGridCell
  // 
  // We hold dilution factor constant to create the visual impression that as we zoom in, 
  // dot density remains constant over a given geographic area. But in fact, as we zoom in each dot covers 1/4 as 
  // much area, so represents 1/4 as many opportunities. We can work backward from the constant dilutionFactor and
  // the zoom level to determine how many opportunities a pixel represents at the current zoom level. If this falls
  // below one we clamp it. When dilutionFactor == tilePixelsPerGridCell, peoplePerDot == 1. Thus 
  // the dilutionFactor must be greater than tilePixelsPerGridCell for a given zoom level. 
  
  // ...and should also be divided by the number of pixels per grid cell which is (2^(zoom_level_diff + 1))^2
  // The number of people per dot should be set to the density where we expect to see a solid fill.
  // We can avoid finding the number of people per dot 
  // by making the grid return the percentile of a cell as a fraction in the range 0..1

  // Reading off the percentile for a given grid value does not normalize them well. 
  // There are a huge amouunt of zeros, ones, twos etc. so all of the interesting data get crammed up near 1.0 and the 
  // plot is almost solid-filled.
  
  // TODO document dilution, using statements in analysis-ui channel and spreadsheet. Divide by peoplePerDot *
  // tilePixelsPerGridCell i.e. distribute the count for the cell into its constituent pixels, then scale those down.
  // The number of tile pixels in a grid cell is getting 4x bigger with each zoom level (2x in each dimension).
  // But our dots are staying the same size on the screen as we zoom in, getting four times smaller (2x in each
  // dimension) in a geographic sense as we zoom in one level. So to avoid looking strange, we allocate 4x less people
  // to each dot as we zoom in. These two perfectly cancel each other out: one increases by 4x and the other
  // decreases. But recognizing that this factor is the product of two numbers allows us to check the people per 
  // dot value. That is, the maximum probability of a dot in a given pixel should be the count of items in that cell
  // divided by the number of pixels per grid cell. ???
