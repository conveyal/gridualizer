/**
 * Dot density grid, using the methodology from the
 * University of Viginia Cooper Center for Public Service's Racial Dot Map,
 * http://demographics.coopercenter.org/DotMap/
 */

import {TileLayer} from 'leaflet'
import Color from 'color'
import MersenneTwister from 'mersenne-twister'

// Dot transparency by zoom level, shamelessly ripped off from https://github.com/unorthodox123/RacialDotMap/blob/master/dotmap.pde
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
  initialize (grid, color = '#49a0d7', placement = Dot.halton({})) {
    // Placement is not a lookup table of dot positions, it's a function that returns dot positions.
    // This allows swapping in different dot positioning strategies.
    this.placement = placement
    this.color = new Color(color)
    // The grid of opportunity densities to visualize as map tiles.
    this.grid = grid
  }

  // Given a web Mercator x, y, and zoom values for a single tile, as well as an associated canvas object,
  // visualize the opportunities falling within that tile as dots on the canvas.
  drawTile (canvas, { x, y }, zoom) {
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(canvas.width, canvas.height)

    // Convert web Mercator tile position to pixels relative to the left and the top of the world at its zoom level.
    x *= 256
    y *= 256

    const transparency = TRANSPARENCY_BY_ZOOM[zoom]
    const rgba = [...this.color.rgbArray(), transparency]

    // Compute the divisor that will convert pixel (or tile) coordinates at the visual map tile zoom level
    // to pixel (or tile) coordinates at the opportunity density grid's zoom level, i.e. the number of visual map
    // pixels (or tiles) an opportunity grid pixel (or tile) is wide.
    // This is always a power of two, so as an optimization we could just store the difference in zoom levels
    // and scale using bitshift operators.
    const pixelWidthAtZoom = Math.pow(2, zoom - this.grid.zoom)

    // Find the top leftmost opportunity grid pixel falling inside the visual map tile we're rendering.
    const gxMin = x / pixelWidthAtZoom - this.grid.west
    const gyMin = y / pixelWidthAtZoom - this.grid.north

    // Iterate over all opportunity grid pixels that fall within this map tile.
    // Due to the fact that mercator grid zoom level sizes are powers of two,
    // when multiple opportunity grid cells fall within a map tile there are always
    // an integer number of them and no partial overlaps.
    for (let gx = gxMin; gx < gxMin + 256 / pixelWidthAtZoom; gx++) {
      for (let gy = gyMin; gy < gyMin + 256 / pixelWidthAtZoom; gy++) {

        // If part of the map tile we're rendering is outside the opportunity density grid, skip over those cells.
        if (gx < 0 || gx >= this.grid.width || gy < 0 || gy >= this.grid.height) continue

        // Call a placement function that will generate reproducible pseudorandom positions for the points in this
        // opportunity grid cell. We specify the number of points to place and a seed based on the grid cell location.
        let locations = this.placement(this.grid.data[gy * this.grid.width + gx], gy * this.grid.width + gx)

        // For each point that was generated, convert from a position in [0, 1) within the opportunity grid cell
        // to a pixel within the visual map tile, and composite the dot into the tile.
        for (let loc of locations) {
          const tx = ((gx - gxMin + loc[0]) * pixelWidthAtZoom) | 0
          const ty = ((gy - gyMin + loc[1]) * pixelWidthAtZoom) | 0

          const imgOffset = ty * 256 * 4 + tx * 4
          const baseColor = imageData.data.slice(imgOffset, imgOffset + 4)
          const combined = composite(baseColor, rgba)

          imageData.data.set(combined, imgOffset)
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  // The following second-order functions produce different dot placement functions, which allows trying different dot
  // placement behavior.
  // The dot placement functions return a reproducible list of N locations given a random number generator seed.
  // Locations are returned as an array of 2-element arrays, where each ordinate is in the range (0, 1].

  /** Generate positions within a pixel for a particular number of dots */
  static halton = ({ baseX = 2, baseY = 3 }) => (count, seed) => {
    const twister = new MersenneTwister(seed)
    const offsetX = Math.floor(twister.random() * 100)
    const offsetY = Math.floor(twister.random() * 100)

    let locations = []

    for (let i = 0; i < count; i++) {
      locations.push([haltonSample(baseX, offsetX + i), haltonSample(baseY, offsetY + i)])
    }

    return locations
  }

  static random = () => (count, seed) => {
    const twister = new MersenneTwister(seed)

    let locations = []
    for (let i = 0; i < count; i++) {
      locations.push([twister.random(), twister.random()])
    }

    return locations
  }
}

function haltonSample (base, index) {
  // see https://en.wikipedia.org/wiki/Halton_sequence
  // it really seems there ought to be a nonrecursive way to do this, if it's slow I'll investigate
  let result = 0
  let f = 1
  while (index > 0) {
    f = f / base
    result += f * (index % base)
    index = Math.floor(index / base)
  }

  return result
}

/**
 * Composite two colors, using alpha compositing
 * https://www.w3.org/TR/SVGTiny12/painting.html#CompositingSimpleAlpha
 */
function composite (baseColor, topColor) {
  const topAlpha = topColor[3] / 255
  const baseAlpha = baseColor[3] / 255
  const topAlphaComplement = 1 - topAlpha
  const baseAlphaComplement = 1 - baseAlpha

  return [
    (topAlphaComplement * baseColor[0] + topColor[0]) | 0,
    (topAlphaComplement * baseColor[1] + topColor[1]) | 0,
    (topAlphaComplement * baseColor[2] + topColor[2]) | 0,
    (255 - topAlphaComplement * baseAlphaComplement * 255) | 0
  ]
}
