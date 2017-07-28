import {scaleLinear} from 'd3-scale'
import range from 'lodash/range'

/**
 * equal interval classifier, potentially in a space other than the linear
 * Passing in no arguments will use a linear space. you can also pass in
 * a { scale } parameter, which should be a d3 continuous scale with the domain set correctly.
 *
 * The 'interface' of a classifier is (grid, nBreaks) to an array of break points.
 * We don't want to pass the scale into the classifier itself (only when constructing the classifier) because
 * applying a scale to other classifier types (e.g. quantile) has no effect. We also don't want to completely
 * transform the input data, just temporarily apply the scale while choosing the break points.
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
