import { constructor as XorShift } from 'xorshift'
import ssCkmeans from 'simple-statistics/src/ckmeans'

/**
 * Tom McWright did some punch-card archaeology to reimplement the Jenks Breaks method
 * in his simple-statistics library. This Ckmeans method supersedes the Jenks method,
 * especially since Ckmenas 3.4.6 improves runtime from O(kn^2) to O(kn log(n)).
 * https://simplestatistics.org/docs/#ckmeans
 */
const ckmeans = ({ noDataValue = null }) => (grid, nBreaks) => {
  // On big data sets, cluster a random sample of the data to keep run time reasonable.
  const maxLength = 10000
  // Filtering out the zeros seems to give more nuanced breaks. There are a huge amount of zeros.
  let filtered = grid.data.filter(i => i !== 0 && i !== noDataValue)
  if (filtered.length > maxLength) {
    const sample = new Int32Array(maxLength)
    const generator = new XorShift([grid.west, grid.north, grid.width, grid.height])
    for (let i = 0; i < maxLength; i++) {
      sample[i] = filtered[(generator.random() * filtered.length) | 0]
    }
    filtered = sample
  }
  const clusters = ssCkmeans(filtered, nBreaks)
  const breaks = []
  for (let i = 0; i < nBreaks; i++) {
    const cluster = clusters[i]
    breaks[i] = cluster[cluster.length - 1]
  }
  return breaks
}

export default ckmeans
