import { normalizeColors } from '../util'

/** Each pixel is randomly set to the color for a number between 0 and 2x 'value', with expected value 'value'. */
const DitherColorizer = (breaks, colors) => {
  const clamp = breaks[breaks.length - 1]
  colors = normalizeColors(colors)
  return (value) => {
    let rand = gaussianApproximation(2, 2, 1) * value
    if (rand > clamp) rand = clamp
    for (var i = 0; i < breaks.length; i++) {
      const z = breaks[i]
      if (rand <= z) return colors[i]
    }
    // No break matched, hot pink
    return [255, 0, 255, 255]
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
