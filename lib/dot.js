/**
 * Dot density grid, using the methodology from the
 * University of Viginia Cooper Center for Public Service's Racial Dot Map,
 * http://demographics.coopercenter.org/DotMap/
 */

import {TileLayer} from 'leaflet'
import Color from 'color'
import MersenneTwister from 'mersenne-twister'

// Dot transparency by zoom level, shamelessly ripped off from
// https://github.com/unorthodox123/RacialDotMap/blob/master/dotmap.pde
const TRANSPARENCY_BY_ZOOM = {
  0: 153,
  1: 153,
  2: 153,
  3: 153,
  4: 153,
  5: 153,
  6: 179,
  7: 179,
  8: 204,
  9: 204,
  10: 230,
  11: 230,
  12: 255,
  13: 255,
  14: 255,
  15: 255,
  16: 255,
  17: 255,
  18: 255,
  19: 255,
  20: 255,
  21: 255,
  22: 255
}

export default class Dot extends TileLayer.Canvas {
    
  // grid is the grid of opportunity densities to visualize as map tiles. 
  // color is the color of the dots to draw.
  initialize (grid, color = '#49a0d7') {
    this.color = new Color(color)
    this.grid = grid
  }

  // Given a web Mercator x, y, and zoom values for a single tile, as well as an associated canvas object,
  // visualize the opportunities falling within that tile as dots on the canvas.
  drawTile (canvas, mercTileCoord, zoom) {
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(canvas.width, canvas.height)

    // Convert web Mercator tile position to pixels relative to the left and the top of the world at its zoom level.
    const mercPixelX = mercTileCoord.x * 256
    const mercPixelY = mercTileCoord.y * 256

    const transparency = TRANSPARENCY_BY_ZOOM[zoom]
    const rgba = [...this.color.rgbArray(), transparency]

    // Compute the divisor that will convert pixel (or tile) coordinates at the visual map tile zoom level
    // to pixel (or tile) coordinates at the opportunity density grid's zoom level, i.e. the number of visual map
    // pixels (or tiles) an opportunity grid pixel (or tile) is wide.
    // This is always a power of two, so as an optimization we could just store the difference in zoom levels
    // and scale using bitshift operators.
    const zoomDifference = zoom - this.grid.zoom
    const gridCellWidthInTilePixels = Math.pow(2, zoomDifference)
    const tileWidthInGridCells = 256 / gridCellWidthInTilePixels 
    // The total number of tile pixels falling within one grid cell in two dimensions, i.e. the square of the width.
    const tilePixelsPerGridCell = gridCellWidthInTilePixels * gridCellWidthInTilePixels * 40
    // FIXME will all this ^ work when zoomDifference is negative, i.e. when we're really zoomed out?
    
    // Find the top leftmost opportunity grid cell falling inside the map tile we're rendering.
    const gxMin = mercPixelX / gridCellWidthInTilePixels - this.grid.west
    const gyMin = mercPixelY / gridCellWidthInTilePixels - this.grid.north
    const gxMax = gxMin + tileWidthInGridCells;
    const gyMax = gxMin + tileWidthInGridCells;
    
    // Set up a random number generator seeded with the web Mercator tile coordinates
    const twister = new MersenneTwister(mercTileCoord.y * 71 + mercTileCoord.x);
    
    // Iterate over all opportunity grid pixels that fall within this map tile.
    // Due to the fact that mercator grid zoom level sizes are powers of two,
    // when multiple opportunity grid cells fall within a map tile there are always
    // an integer number of them and no partial overlaps.
    for (let gx = gxMin; gx < gxMax; gx++) {
      for (let gy = gyMin; gy < gyMax; gy++) {
        // Get density at the four corners of a box extending one cell east and south of the current cell.
        // These densities are adjusted for the number of pixels in a cell, so they represent the average number of
        // opportunities in a single pixel.
        const upperLeft = this.getGridValue(gx, gy) / tilePixelsPerGridCell
        const upperRight = this.getGridValue(gx + 1, gy) / tilePixelsPerGridCell
        const lowerLeft = this.getGridValue(gx, gy + 1) / tilePixelsPerGridCell
        const lowerRight = this.getGridValue(gx + 1, gy + 1) / tilePixelsPerGridCell
        // Do not bother rendering cell if all corners are zero.
        if (upperLeft == 0 && upperRight == 0 && lowerLeft == 0 && lowerRight == 0) continue
        // Determine slopes. Linear interpolation along the left and right edges of the box. 
        const leftSlope = (lowerLeft - upperLeft) / gridCellWidthInTilePixels
        const rightSlope = (lowerRight - upperRight) / gridCellWidthInTilePixels
        // Iterate over all tile pixels falling within this box
        const txMin = (gx - gxMin) * gridCellWidthInTilePixels
        const tyMin = (gy - gyMin) * gridCellWidthInTilePixels
        const txMax = txMin + gridCellWidthInTilePixels
        const tyMax = tyMin + gridCellWidthInTilePixels
        for (let ty = tyMin; ty < tyMax; ty++) {
          if (ty < 0 || ty > 255) continue
          // Evaluate the interpolated lines on the left and right edges of the box at this row of pixels.
          // Then interpolate again along the other axis from left to right (bilinear interpolation).
          const left = upperLeft + leftSlope * (ty - tyMin)
          const right = upperRight + rightSlope * (ty - tyMin)
          const rowSlope = (right - left) / gridCellWidthInTilePixels
          for (let tx = txMin; tx < txMax; tx++) {
            if (tx < 0 || tx > 255) continue
            const interpolatedDensity = left + rowSlope * (tx - txMin)
            // Get a random number in [0, 1) 
            // and plot a dot if that number is less than the number of things in this pixel.
            if (twister.random() < interpolatedDensity) {
              const imgOffset = (ty * 256 + tx) * 4
              imageData.data.set([0, 0, 128, 255], imgOffset)
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
  
}