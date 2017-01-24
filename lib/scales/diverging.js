/** Create a diverging scale from another scale */

import equal from './equal-interval'
import range from 'lodash.range'

/**
 * Create a diverging scale from any other scale, by setting the scheme to another scale.
 * If the center is not zero, specify the center parameter.
 * If the scale you are using requires other options, pass them in as well.
 */

const diverging = ({ scheme = equal, center = 0, ...opts } = {}) => (grid, nBreaks) => {
  if (nBreaks % 2 === 0) nBreaks-- // we need an odd number of clases

  const breaksPerSide = (nBreaks + 1) / 2

  const dataBelow = grid.data.filter(i => i < center)
  const dataAbove = grid.data.filter(i => i > center)

  const classifier = scheme(opts)
  const breaksBelow = dataBelow.length > 0
    ? classifier({ ...grid, data: dataBelow, max: Math.min(grid.max, center) }, breaksPerSide).slice(0, breaksPerSide - 1)
    : range(breaksPerSide - 1).map(i => center)
  const breaksAbove = dataAbove.length > 0
    ? classifier({ ...grid, data: dataAbove, min: Math.max(grid.min, center) }, breaksPerSide)
    : range(breaksPerSide).map(i => center)

  return [...breaksBelow, ...breaksAbove]
}

export default diverging
