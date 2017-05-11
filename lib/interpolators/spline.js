import {getGridValue} from '../util'

/**
 * A 2D constrained spline interpolator.
 *
 * Polynomial (e.g. bicubic) interpolation is prone to oscillation and overshoot.
 * Splines are better behaved but can still overshoot. We can sacrifice smoothness and add a no-overshoot constraint.    * See: http://www.korf.co.uk/spline.pdf
 * Kruger, CJC. Constrained Cubic Spline Interpolation for Chemical Engineering Applications.
 *
 * A pre-calculated bicubic interpolation patch.
 * For a 4x4 grid of samples, this allows us to calculate interpolated values between the central four samples.
 * By pre-fitting the curves in one dimension (y) and proceeding with the interpolation row by row,
 * we re-use most of the computation from one output pixel to the next.
 */
const SplineInterpolator = (grid, gridX, gridY) => {
  // First, find grid coordinates for the sixteen cells.
  // Produces a bicubic interpolation patch for a one-cell square.
  // The patch extends one cell east and south of the specified grid position, but uses 16 cells in the grid.

  // Deal with the edges of the input grid by duplicating adjacent values.
  // It's tempting to do this with typed arrays and slice(), but we need special handling for the grid edges.
  const x0 = (gridX === 0) ? gridX : gridX - 1 // Handle left edge
  const x1 = gridX
  const x2 = (gridX + 1 >= grid.width) ? gridX : gridX + 1 // Handle right edge
  const x3 = (gridX + 2 >= grid.width) ? gridX : gridX + 2 // Handle right edge

  const y0 = (gridY === 0) ? gridY : gridY - 1 // Handle top edge
  const y1 = gridY
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
  const columnInterpolator0 = ConstraintedSplineInterpolator(p00, p01, p02, p03)
  const columnInterpolator1 = ConstraintedSplineInterpolator(p10, p11, p12, p13)
  const columnInterpolator2 = ConstraintedSplineInterpolator(p20, p21, p22, p23)
  const columnInterpolator3 = ConstraintedSplineInterpolator(p30, p31, p32, p33)

  return function (yFraction) {
    // Perform curve fitting in the second (x) dimension based on the pre-fit curves in the y dimension.
    const p0 = columnInterpolator0(yFraction)
    const p1 = columnInterpolator1(yFraction)
    const p2 = columnInterpolator2(yFraction)
    const p3 = columnInterpolator3(yFraction)
    // Return the one-dimensional interpolator for this row.
    return ConstraintedSplineInterpolator(p0, p1, p2, p3)
  }
}
SplineInterpolator.tileOffset = 0.5
export default SplineInterpolator

/**
 * Given four adjacent values a, b, c, d, fit a constrained cubic spline to them, 
 * sacrificing smoothness to prevent overshoot.
 * The returned function provides interpolated values between b and c using a and d to
 * determine the slope going into and out of the b-c interval.
 * The original paper handles the general case where data points are (x,y) pairs.
 * In our case, the four points are always evenly spaced, so we assign X coordinates of 
 * -1, 0, 1, 2 knowing we will perform interpolation between the second and third points.
 * This greatly simplifies the equations, because it gives many differences, multipliers, 
 * and denominators have a value of 1.
 */
const ConstraintedSplineInterpolator = (a, b, c, d) => {
  const test = function (a, b, c, d) {
    let out = []
    let interpolator = new ConstraintedSplineInterpolator (a, b, c, d)
    for (let i = 0; i < 100; i++) {
      out[i] = interpolator(i / 100)
    }
    console.log(out.join(","))
  }
  
  // Optimization: if b and c are equal, interpolate a straight line
  if (b === c) return (x) => b 
  const bSlope = slope(a, b, c) // equation 7a
  const cSlope = slope(b, c, d) // equation 7a
  const bSlope2 = (2 * cSlope + 4 * bSlope) + (6 * (c - b)) // equation 8
  const cSlope2 = (4 * cSlope + 2 * bSlope) - (6 * (c - b)) // equation 9
  const kd = (cSlope2 - bSlope2) / 6                    // equation 10
  const kc = bSlope2 / 2                                // equation 11
  const kb = (c - b) - kc - kd                            // equation 12
  const ka = b                                          // equation 13
  // return (x) => b + (x * (c - b)) // TEST - should be exactly the same as bilinear
  // The returned function takes an x value in [0, 1] expressing the position between b and c,
  // and returns the interpolated value.
  return (x) => ka + kb * x + kc * x ** 2 + kd * x ** 3
}

/**
 * Find the target slope at a particular data point.
 * y here is the same as y sub i in the equations in the paper.
 * yPrev here is y sub i-1 and yNext here is y sub i+1.
 * The equations are simplified significantly by the fact that we know all of our points are exactly one unit apart.
 */
const slope = function (yPrev, y, yNext) {
  const prevSlope = y - yPrev
  const postSlope = yNext - y
  if (prevSlope === 0 || postSlope === 0) return 0 // necessary condition for no overshoot
  if (Math.sign(prevSlope) !== Math.sign(postSlope)) return 0 // includes case where only one slope is zero
  return 2 / (1 / postSlope + 1 / prevSlope)
}
// Finding the slope at the endpoints is messy because it requries recursively computing slopes.
