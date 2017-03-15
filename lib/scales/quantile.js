import {constructor as XorShift} from 'xorshift'

const quantile = ({ noDataValue = null }) => (grid, nBreaks) => {
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

export default quantile
