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
