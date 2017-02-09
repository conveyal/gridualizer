import {scaleLinear} from 'd3-scale'
import range from 'lodash.range'

/**
 * equal interval classifier, potentially in a space other than the linear
 * Passing in no arguments will use a linear space. you can also pass in
 * a { scale } parameter, which should be a d3 continuous scale with the domain set correctly.
 */
const equal = ({ scale } = {}) => (grid, nBreaks) => {
  // copy reference so that it does not persist between calls to thunk
  let localScale = scale
  if (localScale == null) {
    localScale = scaleLinear()
      .domain([grid.min, grid.max])
  }

  // we set the range to determine the classes, and then we invert the scale to find where the breakpoints are
  localScale.range([0, nBreaks])
  return range(1, nBreaks + 1).map(b => localScale.invert(b))
}

export default equal
