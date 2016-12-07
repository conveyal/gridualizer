import range from 'lodash.range'
import {constructor as XorShift} from 'xorshift'

 /** equal interval classifier */
export const equal = () => (grid, nBreaks) => {
  let breaks = []
  let step = (grid.max - grid.min) / nBreaks
  for (let loc = grid.min + step; loc <= grid.max; loc += step) {
    breaks.push(loc)
  }

  return breaks
}

  /** Quantile classifier */
export const quantile = ({noDataValue = null} = {}) => (grid, nBreaks) => {
  let sample

  // Use a sample to make the algorithm tractable. Thanks to the central limit theorem this should
  // be fine.
  if (grid.data.length < 10000) {
    sample = grid.data.slice(0)
  } else {
    sample = new Int32Array(10000)
    const generator = new XorShift([grid.west, grid.north, grid.width, grid.height])

    for (let i = 0; i < 10000; i++) {
      sample[i] = grid.data[(generator.random() * grid.data.length) | 0]
    }
  }

  sample = sample.filter(i => i !== noDataValue)
  sample.sort()

  let step = (sample.length / nBreaks) | 0

  let breaks = []

  for (let i = 0; i < nBreaks - 1; i++) {
    breaks.push(sample[step * (i + 1)])
  }

  // make sure we don't cut any off at the top
  breaks.push(grid.max)

  return breaks
}

  /** Equal interval for diverging data, forces middle class to contain zero */
export const equalDiverging = () => (grid, nBreaks) => {
  if (nBreaks % 2 === 0) nBreaks-- // we need an odd number of clases, subtract so we don't run off the end of the color scale

  const breaksPerSide = (nBreaks + 1) / 2

  const breaks = []

  // make the breaks below zero
  let step = (0 - grid.min) / breaksPerSide

  if (step <= 0) {
    // -1 because we don't include the top break from the lower half (the middle class is the
    // merger of the top class from the lower half and the bottom class from the upper)
    for (let i = 0; i < breaksPerSide - 1; i++) breaks.push(0)
  } else {
    for (let loc = grid.min + step; loc < 0; loc += step) {
      breaks.push(loc)
    }
  }

  step = grid.max / breaksPerSide

  if (step <= 0) {
    for (let i = 0; i < breaksPerSide; i++) breaks.push(0)
  } else {
    for (let loc = step; loc < grid.max; loc += step) {
      breaks.push(loc)
    }
  }

  return breaks
}

export const quantileDiverging = ({noDataValue} = {}) => (grid, nBreaks) => {
  if (nBreaks % 2 === 0) nBreaks-- // we need an odd number of clases

  const breaksPerSide = (nBreaks + 1) / 2

  const dataBelow = grid.data.filter(i => i < 0)
  const dataAbove = grid.data.filter(i => i > 0)

  const classifier = quantile({noDataValue})
  const breaksBelow = dataBelow.length > 0
    ? classifier({ ...grid, data: dataBelow }, breaksPerSide).slice(0, breaksPerSide - 1)
    : range(breaksPerSide - 1).map(i => 0)
  const breaksAbove = dataAbove.length > 0
    ? classifier({ ...grid, data: dataAbove }, breaksPerSide)
    : range(breaksPerSide).map(i => 0)

  return [...breaksBelow, ...breaksAbove]
}
