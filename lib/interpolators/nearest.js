import {getGridValue} from '../util'

/**
 * A nearest-neighbor interpolation patch for a 2x2 grid of samples.
 * This just returns a constant value from the upper left corner of the patch.
 * The nested functions are just to be coherent with the other interpolators, which work row by row.
 */
const NearestNeighborInterpolator = (grid, gridX, gridY) => {
  const z = getGridValue(grid, gridX, gridY)
  return function (yFraction) {
    return xFraction => z
  }
}
NearestNeighborInterpolator.gridOffset = 0
export default NearestNeighborInterpolator
