// Return the value of an opportunity density grid cell.
// Range check and return 0 for cells outside the grid.
// TODO This should really be in the Grid class, and grids should have a default value for empty cells.
function getGridValue (grid, gx, gy) {
  if (gx < 0 || gx >= grid.width || gy < 0 || gy >= grid.height) return 0
  // Convert grid x and y cell coordinates to a 1D offset into the grid.
  // This is a good place to apply log or sqrt transformations if needed.
  return grid.data[gy * grid.width + gx]
}

// An instance of this class represents a curve fit to four uniformly spaced data points.
// Given four adjacent values a, b, c, d, it provides interpolated values between b and c using a and d to 
// determine the slope going into and out of the b-c interval.
// This is only used internally by the bicubic interpolator so it's not exported.
class CubicHermiteInterpolator {
    
  constructor (a, b, c, d) {
    this.c3 = -a / 2.0 + (3.0 * b) / 2.0 - (3.0 * c) / 2.0 + d / 2.0
    this.c2 = a - (5.0 * b) / 2.0 + 2.0 * c - d / 2.0
    this.c1 = -a / 2.0 + c / 2.0;
    this.c0 = b;
  }

  // Given a value in [0, 1] expressing the position between b and c, return the interpolated value.
  interpolate (fraction) {
    return this.c3 * fraction ** 3 + this.c2 * fraction ** 2 + this.c1 * fraction + this.c0;
  }
     
}

// A pre-calculated bicubic interpolation patch.
// For a 4x4 grid of samples, this allows us to calculate interpolated values between the central four samples.
// By pre-fitting the curves in one dimension (y) and proceeding with the interpolation row by row, 
// we re-use most of the computation from one output pixel to the next.
export class BicubicInterpolator {

  static tileOffset = 0.5

  // Supply an unrolled row-major grid of 16 values (a 4x4 grid).
  // The resulting object can be used to interpolate between the inner four cells.
  // Maybe we should be initializing this with a typed 2D array instead of this mess of individual variables.
  constructor (p00, p01, p02, p03, p10, p11, p12, p13, p20, p21, p22, p23, p30, p31, p32, p33) {
    // Create interpolations through each of the four columns
    this.columnInterpolator0 = new CubicHermiteInterpolator(p00, p01, p02, p03)
    this.columnInterpolator1 = new CubicHermiteInterpolator(p10, p11, p12, p13)
    this.columnInterpolator2 = new CubicHermiteInterpolator(p20, p21, p22, p23)
    this.columnInterpolator3 = new CubicHermiteInterpolator(p30, p31, p32, p33)
  }

  // Perform curve fitting in the second (x) dimension based on the pre-fit curves in the y dimension.
  setFractionY (yFraction) {
    const p0 = this.columnInterpolator0.interpolate(yFraction)
    const p1 = this.columnInterpolator1.interpolate(yFraction)
    const p2 = this.columnInterpolator2.interpolate(yFraction)
    const p3 = this.columnInterpolator3.interpolate(yFraction)
    this.rowInterpolator = new CubicHermiteInterpolator(p0, p1, p2, p3) 
  }

  getInterpolatedValue (xFraction) {
    return this.rowInterpolator.interpolate(xFraction)
  }
  
  // Produces a bicubic interpolation patch for a one-cell square in the given grid.
  // The patch extends one cell east and south of the given grid coordinate, but uses 16 cells in the grid.
  static forGridPosition (grid, gridX, gridY) {
  
    // First, find grid coordinates for the sixteen cells.
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
    
    return new BicubicInterpolator (p00, p01, p02, p03, p10, p11, p12, p13, p20, p21, p22, p23, p30, p31, p32, p33)
  }
  
}

// TODO optimization
//        // Do not bother calculating cell if all corners are zero.
//        if (upperLeft === upperRight === lowerLeft === lowerRight)
//           this.getInterpolatedValue = () -> {return upperLeft}
// Could also skip entire patches, drawing nothing into the tile.


// A bilinear interpolation patch for a 2x2 grid of samples.
// Lines are pre-fit in one dimension (y) and interpolation proceeds row by row, 
// re-using most of the computation from one output pixel to the next.
export class BilinearInterpolator {

  static tileOffset = 0.5

  // Supply an unrolled 2x2 box of data points
  constructor (upperLeft, upperRight, lowerLeft, lowerRight) {
    // Store enough information to interpolate along the left and right edges of the 2x2 box
    this.leftIntercept = upperLeft
    this.leftRise = lowerLeft - upperLeft
    this.rightIntercept = upperRight
    this.rightRise = lowerRight - upperRight
  }

  // Fit a line in the second dimension (x) based on the pre-fit curves in the y dimension.
  setFractionY (yFraction) {
    const left = this.leftIntercept + this.leftRise * yFraction
    const right = this.rightIntercept + this.rightRise * yFraction
    this.rowIntercept = left
    this.rowRise = right - left
  }

  getInterpolatedValue (xFraction) {
    return this.rowIntercept + this.rowRise * xFraction
  }

  // Gets a bilinear interpolation patch extending one cell east and south of the given grid coordinate.
  static forGridPosition (grid, gridX, gridY) {
    const p00 = getGridValue(grid, gridX + 0, gridY + 0)
    const p01 = getGridValue(grid, gridX + 0, gridY + 1)
    const p10 = getGridValue(grid, gridX + 1, gridY + 0)
    const p11 = getGridValue(grid, gridX + 1, gridY + 1)
    return new BilinearInterpolator(p00, p10, p01, p11)
  }
  
}

export class NearestNeighborInterpolator {

  static tileOffset = 0
  
  // Supply a value that will be returned as a constant
  constructor (constantValue) {
    this.constantValue = constantValue
  }

  setFractionY (yFraction) { }

  getInterpolatedValue (xFraction) {
    return this.constantValue
  }

  // Gets a constant patch for the given grid coordinate.
  static forGridPosition (grid, gridX, gridY) {
    const value = getGridValue(grid, gridX, gridY)
    return new NearestNeighborInterpolator(value)
  }

}

