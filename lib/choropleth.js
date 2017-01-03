/** A Leaflet layer for showing a grid as a choropleth map */

import Color from 'color'

import {equal} from './breaks'

export default class Choropleth {
  imageHeight = 256
  imageWidth = 256

  /** Construct with a browsochrones grid object */
  // colors courtesy http://colorbrewer2.org/
  constructor ({
    grid,
    breaks = equal(),
    colors = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'],
    labels = 100
  }) {
    this.grid = grid

    this.labels = labels

    // equal interval
    if (breaks instanceof Array) {
      this.breaks = breaks
    } else {
      this.breaks = breaks(grid, colors.length)
    }

    this.colors = colors.map(c => new Color(c))
  }

  createTile = (coords) => {
    const tile = document.createElement('canvas')
    tile.height = this.imageHeight
    tile.width = this.imageWidth
    this.drawTile(tile, coords, coords.z)
    return tile
  }

  drawTile = (canvas, { x, y }, zoom) => {
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(canvas.width, canvas.height)

    // convert to pixels
    x *= 256
    y *= 256

    // factor to convert to zoom of grid
    const zoomFactor = Math.pow(2, zoom - this.grid.zoom)

    for (let ty = 0, offset = 0; ty < canvas.height; ty++) {
      for (let tx = 0; tx < canvas.width; tx++, offset += 4) {
        // convert tile coords to web mercator pixels
        let mx = x + tx / canvas.width * 256
        let my = y + ty / canvas.height * 256

        // convert zoom level
        mx /= zoomFactor
        my /= zoomFactor

        // whole pixel values only, floor
        mx |= 0
        my |= 0

        // get grid coords
        const gx = mx - this.grid.west
        const gy = my - this.grid.north

        const withinGrid = !(gx < 0 || gx >= this.grid.width || gy < 0 || gy >= this.grid.height)
        const value = withinGrid ? this.grid.data[gy * this.grid.width + gx] : 0

        let classIdx = -1

        do {
          classIdx++
        } while (classIdx < this.breaks.length - 1 && this.breaks[classIdx + 1] <= value)

        if (this.colors[classIdx] === undefined) {
          console.log('undefined')
        }

        imageData.data.set([...this.colors[classIdx].rgbArray(), 50], offset)
      }
    }

    ctx.putImageData(imageData, 0, 0)

    // draw labels if zoom level is high enough
    if (zoom > this.labels) {
      // find contained pixels
      const fromGridX = x / zoomFactor - this.grid.west
      const toGridX = (x + 256) / zoomFactor - this.grid.west
      const fromGridY = y / zoomFactor - this.grid.north
      const toGridY = (y + 256) / zoomFactor - this.grid.north

      // if we're zoomed in really far and a single grid pixel takes up multiple map tiles, don't
      // label tiles that are not the top-left-most. Since the mercator pixels nest, some tile will
      // line up with the edge of each grid pixel
      if (fromGridX % 1 === 0 && fromGridY % 1 === 0) {
        for (let gx = fromGridX; gx < toGridX; gx++) {
          if (gx < 0 || gx >= this.grid.width) continue
          const tx = ((gx + this.grid.west) * zoomFactor - x) / 256 * canvas.width

          for (let gy = fromGridY; gy < toGridY; gy++) {
            if (gy < 0 || gy >= this.grid.height) continue
            const ty = ((gy + this.grid.north) * zoomFactor - y) / 256 * canvas.height

            ctx.font = '10px sans'
            ctx.fillStyle = 'black'
            ctx.fillText(`${this.grid.data[gy * this.grid.width + gx]}\n(${gx}, ${gy})`, tx, ty + 10)
          }
        }
      }
    }
  }
}
