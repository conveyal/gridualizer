import { color as parseColor } from 'd3-color'
import { constructor as XorShift } from 'xorshift'

/**
 * This module contains library functions reused throughout the project.
 */

/**
 * Return the value of an opportunity density grid cell.
 * Range check and return 0 for cells outside the grid.
 * TODO This should really be in the Grid class, and grids should have a default value for empty cells.
 * Alternatively, we could inject this into the grid object itself but that might be bad form.
 */
export function getGridValue (grid, gx, gy) {
  if (gx < 0 || gx >= grid.width || gy < 0 || gy >= grid.height) return 0
  // Convert grid x and y cell coordinates to a 1D offset into the grid.
  // This is a good place to apply log or sqrt transformations if needed.
  return grid.data[gy * grid.width + gx]
}

/**
 * Convert an array of colors where each color is a D3 color string, an [r, g, b] array, or an [r, g, b, a] array
 * fractional or integer alpha to an array of [r, g, b, a] arrays with integer alpha,
 * which is what we write directly into output pixels.
 */
export function normalizeColors (colors) {
  return colors.map(c => {
    if (c instanceof Array) {
      // Add alpha if it's missing
      if (c.length === 3) c.push(255)
    } else {
      // Color is not an array, treat it as a D3 color specification
      c = parseColor(c).rgb()
      c = [c.r, c.g, c.b, c.opacity]
    }
    // At this point, c should always be an array of four numbers.
    // Convert floating point alpha to in integer if needed.
    if (c[3] < 1) c[3] = Math.floor(c[3] *= 255)
    return c
  })
}

/**
 * Given a Grid, return an array of 100 quantiles of the non-zero, non-missing values in that Grid.
 */
export function getGridPercentiles (grid) {
  const MAX_SIZE = 10000 // Actually this runs pretty fast even with 160k elements
  const noDataValue = null
  let cleanedData = grid.data.filter(i => i > 0 && i !== noDataValue)
  if (cleanedData.length > MAX_SIZE) {
    const sample = new Int32Array(MAX_SIZE)
    // Initialize the random number generator with the grid's characteristics to make results reproducible
    const generator = new XorShift([grid.west, grid.north, grid.width, grid.height])
    for (let i = 0; i < MAX_SIZE; i++) {
      sample[i] = cleanedData[(generator.random() * cleanedData.length) | 0]
    }
    cleanedData = sample
  }
  cleanedData.sort()
  const step = cleanedData.length / 100.0
  const percentiles = []
  for (let p = 0; p < 101; p++) {
    percentiles[p] = cleanedData[(step * p) | 0]
  }
  return percentiles
}

// Get the 99th percentile of all the _unique_ values in the grid.
// There are a huge amouunt of zeros, ones, twos etc. so most approaches using percentiles to transform the data
// remap all of the interesting data up near 1.0, creating an almost solid-filled plot.
export function getTrimmedMax (grid) {
  const distinct = Int32Array.from(new Set(grid.data))
  distinct.sort()
  return distinct[(distinct.length * 0.99) | 0]
}

// Attempt to remove outliers by repeatedly finding the maximum of random samples of the data.
// The typical 1.5x interquartile range approach is not effective because density is not normally distributed.
export function getTrimmedMax2 (grid) {
  const noDataValue = null
  const cleanedData = grid.data.filter(i => i > 0 && i !== noDataValue)
  cleanedData.sort()
  const generator = new XorShift([grid.west, grid.north, grid.width, grid.height])
  const maxes = []
  for (let i = 0; i < 15; i++) {
    let max = 0
    for (let s = 0; s < 10000; s++) {
      const x = cleanedData[(generator.random() * cleanedData.length) | 0]
      if (x > max) max = x
    }
    maxes.push(max)
  }
  maxes.sort()
  const medianMax = maxes[(maxes.length / 2) | 0]
  return medianMax
}

// Find the 99th percentile of all the grid data not near zero.
// Requires magic numbers (minimum density) to get good results where there are lots of small-valued cells.
export function getTrimmedMax3 (grid) {
  const MIN_DENSITY = 50
  const noDataValue = null
  const cleanedData = grid.data.filter(i => i > MIN_DENSITY && i !== noDataValue)
  cleanedData.sort()
  return cleanedData[(cleanedData.length * 0.99) | 0]
}

/**
 * This will draw one dot into the imageData, as a square with the given width.
 * If you set width to a number that increases by powers of 2 with the zoom level, this gives the illusion of
 * dots of a fixed geographic size. For example, width = (zoom - 12) ** 2.
 * The problem is that at least with our current method these dots jump around when you zoom (random placement)
 * and the dots are rendered to a single tile in isolation, so dots are clipped at the edge of tiles.
 */
export function drawDot (imgData, x, y, width, color) {
  // Resulting color has some opacity, write it into the tile
  for (let dy = 0; dy < width; dy++) {
    if (y + dy > 255) break
    for (let dx = 0; dx < width; dx++) {
      if (x + dx > 255) continue
      const imgOffset = ((y + dy) * 256 + x + dx) * 4
      imgData.data.set(color, imgOffset)
    }
  }
}
