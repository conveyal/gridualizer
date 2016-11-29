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
    this.placement = placement
    this.color = new Color(color)
    this.grid = grid
  }

  drawTile (canvas, { x, y }, zoom) {
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(canvas.width, canvas.height)

    // convert to pixels
    x *= 256
    y *= 256

    const transparency = TRANSPARENCY_BY_ZOOM[zoom]
    const rgba = [...this.color.rgbArray(), transparency]

    // factor to convert to zoom of grid
    const pixelWidthAtZoom = Math.pow(2, zoom - this.grid.zoom)

    const gxMin = x / pixelWidthAtZoom - this.grid.west
    const gyMin = y / pixelWidthAtZoom - this.grid.north

    for (let gx = gxMin; gx < gxMin + 256 / pixelWidthAtZoom; gx++) {
      for (let gy = gyMin; gy < gyMin + 256 / pixelWidthAtZoom; gy++) {
        // don't accidentally wrap around
        if (gx < 0 || gx >= this.grid.width || gy < 0 || gy >= this.grid.height) continue

        // place the points
        let locations = this.placement(this.grid.data[gy * this.grid.width + gx], gy * this.grid.width + gx)

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
