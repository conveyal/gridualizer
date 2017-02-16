import ChoroplethColorizer from './choropleth'

/** 
 * Each pixel is set to the color for a number between 0 and 2x 'value', with expected value 'value'. 
 * The idea is that the underlying grid is supplying a human/opportunity density number at every pixel. 
 * There may be more or less people than that average density in a given pixel, but across a whole area of equal density
 * the average should be roughly correct.
 * In low density places, the choropleth should step up in opacity for each person present in a pixel. 
 * The breaks would just be 0, 1, 2. However, density ranges can be very wide, so we generalize the idea to
 * arbitrary, possibly nonlinear breaks. We also don't want the perceived color to 'dilute' severely as we zoom in, 
 * so we do not adjust the densities for the number of pixels per cell.
 */
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
