/** A Leaflet layer for showing a grid as a choropleth map */

import {TileLayer} from 'leaflet'
import Color from 'color'

export default class Choropleth extends TileLayer.Canvas {
  /** Construct with a browsochrones grid object */
  // colors courtesy http://colorbrewer2.org/
  initialize (grid, breaks = Choropleth.equal(), colors = ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'], labels = 100) {
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

  drawTile (canvas, { x, y }, zoom) {
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

        let classIdx = 0

        while (classIdx < this.breaks.length - 1 && this.breaks[classIdx] < value) classIdx++

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

 /** equal interval classifier */
  static equal = () => (grid, nBreaks) => {
    let breaks = []
    let step = (grid.max - grid.min) / nBreaks
    for (let loc = grid.min + step; loc <= grid.max; loc += step) {
      breaks.push(loc)
    }

    return breaks
  }

  /** Quantile classifier */
  static quantile = ({ noDataValue = null }) => (grid, nBreaks) => {
    let sample

    // Use a sample to make the algorithm tractable. Thanks to the central limit theorem this should
    // be fine.
    if (grid.data.length < 10000) {
      sample = grid.data.slice(0)
    } else {
      sample = new Int32Array(10000)

      for (let i = 0; i < 10000; i++) {
        sample[i] = grid.data[(Math.random() * grid.data.length) | 0]
      }
    }

    sample = sample.filter(i => i !== noDataValue)
    sample.sort()

    let step = (sample.length / nBreaks) | 0

    let breaks = []

    for (let i = 0; i < nBreaks - 1; i++) {
      breaks.push(sample[step * (i + 1)])
    }

    // make sure we don't cut any off at the top
    breaks.push(grid.max)

    return breaks
  }
}
