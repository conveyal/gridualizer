import {getGridValue} from '../util'

/**
 * A bilinear interpolation patch for a 2x2 grid of samples.
 * Lines are pre-fit in one dimension (y) and interpolation proceeds row by row,
 * re-using most of the computation from one output pixel to the next.
 */
const BilinearInterpolator = (grid, gridX, gridY) => {
  // Get a patch extending one cell east and south of the given grid location.
  const upperLeft = getGridValue(grid, gridX + 0, gridY + 0)
  const lowerLeft = getGridValue(grid, gridX + 0, gridY + 1)
  const upperRight = getGridValue(grid, gridX + 1, gridY + 0)
  const lowerRight = getGridValue(grid, gridX + 1, gridY + 1)
  // Store enough information to interpolate along the left and right edges of the 2x2 box
  const leftIntercept = upperLeft
  const leftRise = lowerLeft - upperLeft
  const rightIntercept = upperRight
  const rightRise = lowerRight - upperRight
  // For a given y position inside the patch in [0, 1],
  // The bilinear interpolator returns a 1D interpolator for that single row.
  return yFraction => {
    // Fit a line in the second dimension (x) based on the pre-fit curves in the y dimension.
    const left = leftIntercept + leftRise * yFraction
    const right = rightIntercept + rightRise * yFraction
    const rowIntercept = left
    const rowRise = right - left
    // return a 1D linear interpolator for a single row.
    return xFraction => rowIntercept + rowRise * xFraction
  }
}
BilinearInterpolator.gridOffset = 0.5
export default BilinearInterpolator

// TODO optimization
//        // Do not bother calculating cell if all corners are zero.
//        if (upperLeft === upperRight === lowerLeft === lowerRight)
//           this.getInterpolatedValue = () -> {return upperLeft}
// Could also skip entire patches, drawing nothing into the tile.
