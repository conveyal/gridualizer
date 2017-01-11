/** A Leaflet layer for showing a grid as a choropleth map */

import {TileLayer} from 'leaflet'
import {color} from 'd3-color'
import range from 'lodash.range'
import { constructor as XorShift } from 'xorshift'

export default class Choropleth extends TileLayer.Canvas {
  /** Construct with a browsochrones grid object */
  // colors courtesy http://colorbrewer2.org/
  initialize ({
    grid,
    breaks = Choropleth.equal(),
    colors = [
      'rgba(238, 243, 255, 0.42)',
      'rgba(189, 215, 231, 0.42)',
      'rgba(107, 174, 214, 0.42)',
      'rgba(49, 130, 189, 0.42)',
      'rgba(8, 81, 156, 0.42)'
    ],
    labels = 100,
    noDataValue
  }) {
    this.grid = grid

    this.labels = labels

    // equal interval
    if (breaks instanceof Array) {
      this.breaks = breaks
    } else {
      this.breaks = breaks(grid, colors.length)
    }

    this.colors = colors.map(c => color(c).rgb())

    this.noDataValue = noDataValue
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
        if (!withinGrid || value === this.noDataValue) {
          imageData.data.set([0, 0, 0, 0]) // fully transparent
        } else {
          const classIdx = getClassIndex(value, this.breaks)

          if (this.colors[classIdx] === undefined) {
            console.log('undefined')
          }

          const { r, g, b, opacity } = this.colors[classIdx]
          imageData.data.set([r, g, b, Math.round(opacity * 255)], offset)
        }
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

 /** equal interval classifier */
  static equal = () => (grid, nBreaks) => {
    let breaks = []

    if (grid.max <= grid.min) throw new Error('Grid max must be greater than min for equal interval classification')

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
      const generator = new XorShift([grid.west, grid.north, grid.width, grid.height])

      for (let i = 0; i < 10000; i++) {
        sample[i] = grid.data[(generator.random() * grid.data.length) | 0]
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

  /** Equal interval for diverging data, forces middle class to contain zero */
  static equalDiverging = () => (grid, nBreaks) => {
    if (nBreaks % 2 === 0) nBreaks-- // we need an odd number of clases, subtract so we don't run off the end of the color scale

    const breaksPerSide = (nBreaks + 1) / 2

    const breaks = []

    // make the breaks below zero
    let step = (0 - grid.min) / breaksPerSide

    if (step <= 0) {
      // -1 because we don't include the top break from the lower half (the middle class is the
      // merger of the top class from the lower half and the bottom class from the upper)
      for (let i = 0; i < breaksPerSide - 1; i++) breaks.push(0)
    } else {
      for (let loc = grid.min + step; loc < 0; loc += step) {
        breaks.push(loc)
      }
    }

    step = grid.max / breaksPerSide

    if (step <= 0) {
      for (let i = 0; i < breaksPerSide; i++) breaks.push(0)
    } else {
      for (let loc = step; loc < grid.max; loc += step) {
        breaks.push(loc)
      }
    }

    return breaks
  }

  static quantileDiverging = ({ noDataValue }) => (grid, nBreaks) => {
    if (nBreaks % 2 === 0) nBreaks-- // we need an odd number of clases

    const breaksPerSide = (nBreaks + 1) / 2

    const dataBelow = grid.data.filter(i => i < 0)
    const dataAbove = grid.data.filter(i => i > 0)

    const classifier = Choropleth.quantile({noDataValue})
    const breaksBelow = dataBelow.length > 0
      ? classifier({ ...grid, data: dataBelow }, breaksPerSide).slice(0, breaksPerSide - 1)
      : range(breaksPerSide - 1).map(i => 0)
    const breaksAbove = dataAbove.length > 0
      ? classifier({ ...grid, data: dataAbove }, breaksPerSide)
      : range(breaksPerSide).map(i => 0)

    return [...breaksBelow, ...breaksAbove]
  }
}

/**
 * Get the class index based on breaks (breaks[i] is the top of class i).
 * Separate function so that unit tests can be written.
 */
export function getClassIndex (value, breaks) {
  // increment the class index until we get to the end of the array or the previous break is smaller
  // than the value
  let classIdx = 0
  while (classIdx < breaks.length - 1 && breaks[classIdx] < value) classIdx++
  return classIdx
}
