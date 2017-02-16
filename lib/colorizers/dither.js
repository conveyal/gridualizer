import ChoroplethColorizer from './choropleth'

/** Each pixel is randomly set to the color for a number between 0 and 2x 'value', with expected value 'value'. */
const DitherColorizer = (breaks, colors) => {
  const baseColorizer = ChoroplethColorizer(breaks, colors)
  return (value) => {
    let rand = gaussianApproximation(2, 2, 1)
    return baseColorizer(rand * value)
  }
}

/**
 * Approximate a normal distribution with a Bates distribution (the mean of N uniform random variables on [0, 1]).
 * The function returns a single draw from such an approximation centered on the given mean, with the given width.
 */
const gaussianApproximation = (iterations, width, mean) => {
  var sum = 0
  for (var i = 0; i < iterations; i++) sum += Math.random()
  // Center around zero and expand to specified width
  return ((sum / iterations) - 0.5) * width + mean
}

export default DitherColorizer
