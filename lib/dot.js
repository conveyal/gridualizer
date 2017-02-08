/**
 * Dot density grid, with bilinear interpolation between opportunity density cells and multiple opacity layers
 * for overlappig dots.
 */

import {TileLayer} from 'leaflet'
import Color from 'color'

export default class Dot extends TileLayer.Canvas {
  // grid is the grid of opportunity densities to visualize as map tiles (class from Browsochrones).
  // color is the color of the dots to draw.
  initialize (grid, color = '#49a0d7') {
    this.color = new Color(color).rgbArray()
    this.grid = grid
    //this.colorScale = new CutoffColorScale(1000, [0, 0, 0, 0], [...this.color, 128])
    this.colorScale = new InterpolatingColorScale([[200, 0, 0, 200, 0], [2000, 0, 0, 200, 180], [20000, 150, 0, 0, 180]])
    //this.colorScale = new DotColorScale(this.color, 2000)
  }

  // Given a web Mercator x, y, and zoom values for a single tile, as well as an associated canvas object,
  // visualize the opportunities falling within that tile as dots on the canvas.
  drawTile (canvas, mercTileCoord, zoom) {
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(canvas.width, canvas.height)

    const [red, green, blue] = this.color

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
    // The total number of tile pixels falling within one grid cell, i.e. the square of the width in pixels.
    // This is used to convert job counts per cell to job counts per pixel.
    // NOTE that this is instead proportional to the number of pixels in one dimension, which seems to scale better
    // const tilePixelsPerGridCell = gridCellWidthInTilePixels * gridCellWidthInTilePixels * 150
    // const tilePixelsPerGridCell = ZSCALE_BY_ZOOM[zoom] * 500
    const tilePixelsPerGridCell = gridCellWidthInTilePixels * this.grid.max / 200

    // Find the range of grid cells that contribute to the contents of the map tile we're rendering.
    // When interpolating, we consider the grid cell value to be at the center of the cell,
    // so we need to hit one extra row of cells outside the tile.
    const gxMin = mercPixelX / gridCellWidthInTilePixels - this.grid.west - 1
    const gyMin = mercPixelY / gridCellWidthInTilePixels - this.grid.north - 1
    const gxMax = gxMin + tileWidthInGridCells + 1
    const gyMax = gyMin + tileWidthInGridCells + 1

    // Iterate over all opportunity grid pixels that contribute to the contents of the map tile we're rendering.
    // Due to the fact that mercator grid zoom level sizes are powers of two,
    // when multiple opportunity grid cells fall within a map tile there are always
    // an integer number of them and no partial overlaps.
    // But for interpolation purposes, we work on boxes that are offset 1/2 cell to the east and south because
    // we consider grid cell values to be at the center (rather than the corner) of those cells.
    for (let gx = gxMin; gx < gxMax; gx++) {
      for (let gy = gyMin; gy < gyMax; gy++) {
        const patch = this.getInterpolationPatch(gx, gy)
        // Iterate over all the output tile pixels covered by this patch.
        // Note the half-grid-cell offset because the grid cell value is considered to be at the cell's center.
        const txMin = (gx - gxMin) * gridCellWidthInTilePixels - gridCellWidthInTilePixels / 2
        const tyMin = (gy - gyMin) * gridCellWidthInTilePixels - gridCellWidthInTilePixels / 2
        const txMax = txMin + gridCellWidthInTilePixels
        const tyMax = tyMin + gridCellWidthInTilePixels
        for (let ty = tyMin; ty < tyMax; ty++) {
          if (ty < 0 || ty > 255) continue
          // Todo: refactor to iterate over relative x and y?
          patch.setFractionY((ty - tyMin) / gridCellWidthInTilePixels) 
          for (let tx = txMin; tx < txMax; tx++) {
            if (tx < 0 || tx > 255) continue
            // Todo: refactor to iterate over relative x and y?
            const interpolatedValue = patch.getInterpolatedValue((tx - txMin) / gridCellWidthInTilePixels)
            //const opacity = Dot.getDotOpacity(interpolatedValue / 3000)
            //const opacity = Dot.getIsochroneOpacity(interpolatedValue)
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

  // Return the value of an opportunity density grid cell.
  // Range check and return 0 for cells outside the grid.
  getGridValue (gx, gy) {
    if (gx < 0 || gx >= this.grid.width || gy < 0 || gy >= this.grid.height) return 0
    // Convert grid x and y cell coordinates to a 1D offset into the grid
    return this.grid.data[gy * this.grid.width + gx]
  }
  
  // Gets an interpolation patch extending one cell east and south of the given grid coordinate.
  // It's tempting to do this with typed arrays and slice(), but we need special handling for the grid edges.
  getInterpolationPatch (gridX, gridY) {

    // At the edges of the input grid, duplicate missing values
    
    const x0 = (gridX == 0) ? gridX : gridX - 1; // Handle left edge
    const x1 =  gridX
    const x2 = (gridX + 1 >= this.grid.width) ? gridX : gridX + 1 // Handle right edge
    const x3 = (gridX + 2 >= this.grid.width) ? gridX : gridX + 2 // Handle right edge

    const y0 = (gridY == 0) ? gridY : gridY - 1; // Handle top edge
    const y1 =  gridY
    const y2 = (gridY + 1 >= this.grid.height) ? gridY : gridY + 1 // Handle bottom edge
    const y3 = (gridY + 2 >= this.grid.height) ? gridY : gridY + 2 // Handle bottom edge

    const p00 = this.getGridValue(x0, y0)
    const p01 = this.getGridValue(x0, y1)
    const p02 = this.getGridValue(x0, y2)
    const p03 = this.getGridValue(x0, y3)

    const p10 = this.getGridValue(x1, y0)
    const p11 = this.getGridValue(x1, y1)
    const p12 = this.getGridValue(x1, y2)
    const p13 = this.getGridValue(x1, y3)

    const p20 = this.getGridValue(x2, y0)
    const p21 = this.getGridValue(x2, y1)
    const p22 = this.getGridValue(x2, y2)
    const p23 = this.getGridValue(x2, y3)
    
    const p30 = this.getGridValue(x3, y0)
    const p31 = this.getGridValue(x3, y1)
    const p32 = this.getGridValue(x3, y2)
    const p33 = this.getGridValue(x3, y3)
    
    return new BicubicPatch (p00, p01, p02, p03, p10, p11, p12, p13, p20, p21, p22, p23, p30, p31, p32, p33)
  }
      
}

// An instance of this class represents a curve fit to four uniformly spaced data points.
// Given four adjacent values a, b, c, d, it provides interpolated values between b and c using a and d to 
// determine the slope going into and out of the b-c interval.
class CubicHermiteInterpolator {
    
  constructor (a, b, c, d) {
    this.c3 = -a / 2.0 + (3.0 * b) / 2.0 - (3.0 * c) / 2.0 + d / 2.0
    this.c2 = a - (5.0 * b) / 2.0 + 2.0 * c - d / 2.0
    this.c1 = -a / 2.0 + c / 2.0;
    this.c0 = b;
  }

  // Given a value in [0, 1] expressing the position between b and c, return the interpolated value.
  interpolate (fraction) {
    return this.c3 * fraction ** 3 + this.c2 * fraction ** 2 + this.c1 * fraction + this.c0;
  }
     
}

// Represents a pre-calculated interpolation for a patch of sixteen data samples.
// For a 4x4 grid of samples, this allows us to calculate interpolated values between the central four samples.
// By pre-fitting the curves in one dimension (y) and proceeding with the interpolation row by row, 
// we re-use most of the computation from one output pixel to the next.
class BicubicPatch {

  // Supply an unrolled row-major grid of 16 values (a 4x4 grid).
  // The resulting object can be used to interpolate between the inner four cells.
  // Maybe we should be initializing this with a typed 2D array instead of this mess of individual variables.
  constructor (p00, p01, p02, p03, p10, p11, p12, p13, p20, p21, p22, p23, p30, p31, p32, p33) {
    // Create interpolations through each of the four columns
    this.columnInterpolator0 = new CubicHermiteInterpolator(p00, p01, p02, p03)
    this.columnInterpolator1 = new CubicHermiteInterpolator(p10, p11, p12, p13)
    this.columnInterpolator2 = new CubicHermiteInterpolator(p20, p21, p22, p23)
    this.columnInterpolator3 = new CubicHermiteInterpolator(p30, p31, p32, p33)
  }

  // Perform curve fitting in the second (x) dimension based on the pre-fit curves in the y dimension.
  setFractionY (yFraction) {
    const p0 = this.columnInterpolator0.interpolate(yFraction)
    const p1 = this.columnInterpolator1.interpolate(yFraction)
    const p2 = this.columnInterpolator2.interpolate(yFraction)
    const p3 = this.columnInterpolator3.interpolate(yFraction)
    this.rowInterpolator = new CubicHermiteInterpolator(p0, p1, p2, p3) 
  }

  getInterpolatedValue (xFraction) {
    return this.rowInterpolator.interpolate(xFraction)
  }
  
}

class InterpolatingColorScale {

  // Pass in an array of [[z, r, g, b, a], [z, r, g, b, a], [z, r, g, b, a]...]
  constructor (breaks) {
    this.breaks = breaks
    this.interpolate = true
  }

  getColorForValue (value) {
    var currBreak, prevBreak
    prevBreak = this.breaks[0]
    for (currBreak of this.breaks) {
      if (value < currBreak[0]) {
        if (this.interpolate) {
          const [z0, r0, g0, b0, a0] = prevBreak
          const [z1, r1, g1, b1, a1] = currBreak
          const frac = (value - z0) / (z1 - z0)
          const r = r0 + (r1 - r0) * frac
          const g = g0 + (g1 - g0) * frac
          const b = b0 + (b1 - b0) * frac
          const a = a0 + (a1 - a0) * frac
          return [r, g, b, a]
        } else {
          const [z, r, g, b, a] = currBreak
          return [r, g, b, a]
        }        
      }
      prevBreak = currBreak
    }
    const [z, r, g, b, a] = prevBreak
    return [r, g, b, a]
  }
  
}

class CutoffColorScale {

  // any value below cutoff will 
  // colors are [r, g, b, a]
  constructor (cutoff, lowColor, highColor) {
    this.cutoff = cutoff
    this.lowColor = lowColor
    this.highColor = highColor
  }

  getColorForValue (value) {
    if (value < this.cutoff) return this.lowColor
    else return this.highColor
  }
  
}

// This one expects values to be small integers, so divide high densities down accordingly
class DotColorScale {
  
  // The scale factor is how many people/jobs/whatever must be present to trigger one dot.
  constructor (color, scaleFactor) {
    this.color = color
    this.scaleFactor = scaleFactor
  }
  
  // Get a random number in [0, 1)
  // and plot a dot if that number is less than the number of things in this pixel.
  // We were using a JS Mersenne Twister, which was using 65% of CPU time according to a profiler.
  // Math.random uses an xorshift method in V8, dropping to 4% of CPU time.
  getColorForValue (value) {
    value /= this.scaleFactor
    const r = Math.random()
    let opacity = 0
    if (r < value) {
      opacity = 63
      if (r * 2 < value) opacity += 64
      if (r * 3 < value) opacity += 64
      if (r * 4 < value) opacity += 64
    }
    return [...this.color, opacity]
  }

}

