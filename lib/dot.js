/** Dot density grid */

import {TileLayer} from 'leaflet'
import Color from 'color'
import MersenneTwister from 'mersenne-twister'

export default class Dot extends TileLayer.Canvas {
  initialize (grid, color = '#49a0d7', placement = Dot.halton({}), dotSizePx = 2) {
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
          const tx = Math.floor((gx - gxMin + loc[0]) * pixelWidthAtZoom)
          const ty = Math.floor((gy - gyMin + loc[1]) * pixelWidthAtZoom)

          // TODO varying opacity
          imageData.data.set([...this.color.rgbArray(), 50], ty * 256 * 4 + tx * 4)
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
