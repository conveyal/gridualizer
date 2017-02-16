import { color as parseColor } from 'd3-color'

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

// Convert an array of colors where each color is a D3 color string, an [r, g, b] array, or an [r, g, b, a] array
// fractional or integer alpha to an array of [r, g, b, a] arrays with integer alpha,
// which is what we write directly into output pixels.
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
