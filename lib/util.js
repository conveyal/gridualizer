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
    let sample = new Int32Array(MAX_SIZE)
    // Initialize the random number generator with the grid's characteristics to make results reproducible
    const generator = new XorShift([grid.west, grid.north, grid.width, grid.height])
    for (let i = 0; i < MAX_SIZE; i++) {
      sample[i] = cleanedData[(generator.random() * cleanedData.length) | 0]
    }
    cleanedData = sample
  }
  cleanedData.sort()
  let step = cleanedData.length / 100.0
  let percentiles = []
  for (let p = 0; p < 101; p++) {
    percentiles[p] = cleanedData[(step * p) | 0]
  }
  return percentiles
}

// Attempt to remove outliers by repeatedly finding the maximum of random samples of the data.
// The typical 1.5x interquartile range approach is no good because density is not normally distributed.
export function getTrimmedMax2 (grid) {
  const noDataValue = null
  let cleanedData = grid.data.filter(i => i > 0 && i !== noDataValue)
  cleanedData.sort()
  const generator = new XorShift([grid.west, grid.north, grid.width, grid.height])
  let maxes = []
  for (let i = 0; i < 15; i++) {
    let max = 0
    for (let s = 0; s < 10000; s++) {
      let x = cleanedData[(generator.random() * cleanedData.length) | 0]
      if (x > max) max = x        
    }
    maxes.push(max)
  }
  maxes.sort()
  const medianMax = maxes[(maxes.length / 2) | 0]
  return medianMax
}

export function getTrimmedMax3 (grid) {
  const MIN_DENSITY = 50
  const noDataValue = null
  let cleanedData = grid.data.filter(i => i > MIN_DENSITY && i !== noDataValue)
  cleanedData.sort()
  return cleanedData[(cleanedData.length * 0.99) | 0]
}

export function getTrimmedMax (grid) {
  let distinct = Int32Array.from(new Set(grid.data));
  distinct.sort()
  return distinct[(distinct.length * 0.99) | 0]
}

/**
 * Filter a Grid, returning a copy of its data with missing values and zeros removed.
 * TODO This should really be in the Grid class.
 * This also samples the grid values if there are too many.
 */
export function filterGrid (grid, missingValue) {
    
}