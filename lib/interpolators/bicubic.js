import {getGridValue} from '../util'

/**
 * A pre-calculated bicubic interpolation patch.
 * For a 4x4 grid of samples, this allows us to calculate interpolated values between the central four samples.
 * By pre-fitting the curves in one dimension (y) and proceeding with the interpolation row by row, 
 * we re-use most of the computation from one output pixel to the next.
 */
const BicubicInterpolator = (grid, gridX, gridY) => {
  // First, find grid coordinates for the sixteen cells.
  // Produces a bicubic interpolation patch for a one-cell square.
  // The patch extends one cell east and south of the specified grid position, but uses 16 cells in the grid.

  // Deal with the edges of the input grid by duplicating adjacent values.
  // It's tempting to do this with typed arrays and slice(), but we need special handling for the grid edges.
  const x0 = (gridX == 0) ? gridX : gridX - 1; // Handle left edge
  const x1 =  gridX
  const x2 = (gridX + 1 >= grid.width) ? gridX : gridX + 1 // Handle right edge
  const x3 = (gridX + 2 >= grid.width) ? gridX : gridX + 2 // Handle right edge
  
  const y0 = (gridY == 0) ? gridY : gridY - 1; // Handle top edge
  const y1 =  gridY
  const y2 = (gridY + 1 >= grid.height) ? gridY : gridY + 1 // Handle bottom edge
  const y3 = (gridY + 2 >= grid.height) ? gridY : gridY + 2 // Handle bottom edge

  const p00 = getGridValue(grid, x0, y0)
  const p01 = getGridValue(grid, x0, y1)
  const p02 = getGridValue(grid, x0, y2)
  const p03 = getGridValue(grid, x0, y3)

  const p10 = getGridValue(grid, x1, y0)
  const p11 = getGridValue(grid, x1, y1)
  const p12 = getGridValue(grid, x1, y2)
  const p13 = getGridValue(grid, x1, y3)

  const p20 = getGridValue(grid, x2, y0)
  const p21 = getGridValue(grid, x2, y1)
  const p22 = getGridValue(grid, x2, y2)
  const p23 = getGridValue(grid, x2, y3)
  
  const p30 = getGridValue(grid, x3, y0)
  const p31 = getGridValue(grid, x3, y1)
  const p32 = getGridValue(grid, x3, y2)
  const p33 = getGridValue(grid, x3, y3)

  // Create interpolations through each of the four columns
  // Supply an unrolled row-major grid of 16 values (a 4x4 grid).
  // The resulting object can be used to interpolate between the inner four cells.
  // Maybe we should be initializing this with a typed 2D array instead of this mess of individual variables.
  const columnInterpolator0 = CubicHermiteInterpolator(p00, p01, p02, p03)
  const columnInterpolator1 = CubicHermiteInterpolator(p10, p11, p12, p13)
  const columnInterpolator2 = CubicHermiteInterpolator(p20, p21, p22, p23)
  const columnInterpolator3 = CubicHermiteInterpolator(p30, p31, p32, p33)
  
  return function (yFraction) {
    // Perform curve fitting in the second (x) dimension based on the pre-fit curves in the y dimension.
    const p0 = columnInterpolator0(yFraction)
    const p1 = columnInterpolator1(yFraction)
    const p2 = columnInterpolator2(yFraction)
    const p3 = columnInterpolator3(yFraction)
    // Return the one-dimensional interpolator for this row.
    return CubicHermiteInterpolator(p0, p1, p2, p3)     
  }
}
BicubicInterpolator.tileOffset = 0.5
export default BicubicInterpolator

/** 
 * Given four adjacent values a, b, c, d, fit a curve to them.
 * The returned function provides interpolated values between b and c using a and d to 
 * determine the slope going into and out of the b-c interval.
 */
const CubicHermiteInterpolator = (a, b, c, d) => {
  const c3 = -a / 2.0 + (3.0 * b) / 2.0 - (3.0 * c) / 2.0 + d / 2.0
  const c2 = a - (5.0 * b) / 2.0 + 2.0 * c - d / 2.0
  const c1 = -a / 2.0 + c / 2.0
  const c0 = b
  // This function takes a value in [0, 1] expressing the position between b and c, 
  // and returns the interpolated value.
  return (fraction) => c3 * fraction ** 3 + c2 * fraction ** 2 + c1 * fraction + c0
}
