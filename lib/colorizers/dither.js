// This one expects values to be small integers, so divide high densities down accordingly
// The scale factor is how many people/jobs/whatever must be present to trigger one dot.
//
// It turns out that this is really the same thing as other methods, with dithering.
// Just pass in colors and breaks, which could be the same color at four different opacities and equidistant breaks.
//
// Our original approach was to generate a number in [0, 1] and treat the interpolated densities as probabilities.
// This works if you divide the total number of people by the number of pixels,
// and each pixel contains a fractional number of people < 1.
// If the random number was less than the probability, there was someone in the cell.
// The problem is that this changes strongly in appearance as you zoom in.
// But this is still not quite right, just because there is a density of 1 person per cell does not mean every cell
// is full. Some may contain 2 people and others may contain 0.
// Some do contain zero people. A pixel being full just means it contains one _or more_ people. When does it contain
// two people? When random * 2 is still less than the value of the cell, or when random < value/2. How do you
// generalize this to color scales?
// One thing seems clear: the disappearance (emptiness) of a cell should not be a separate decision. It should happen
// when some value falls within a transparent break.
//
// Dithering is in fact not the right approach. The point of dithering is to smooth out quantization error.
// You add some (shaped) random noise to the signal so it rounds off or truncates to the quantized values with
// some probability, rather than deterministically for a range of inputs. This makes error uncorrelated with the
// signal rather than determined by the signal. So with dithering a given pixel can round up or down, but cannot
// ever take on a more distant color category. It's smoothing. This is not what we want.
//
// What we want is to take an expected number of people (density) per pixel, and get a bunch of random samples with
// that expected value. The trick is that the distributions are discrete (which makes them more efficient though).
// For each pixel, we want to draw from a distribution with the given mean and a fixed (proportionate) variance.
// We could generate one distribution and just scale the input value. Note that this is not a normal distribution.
// At median of 1, we can have some zero cells but no values below zero, but it's unlimited on the high end.
// As an approximation, we can use a triangular distribution on [0, 3] and peaking at 1.5, truncating the results.

const DitherColorizer = (breaks) => {
  return (value) => {
    const rand = gaussianApproximation(2, 2, 1) * value
    for (const currBreak of breaks) {
      const [z, r, g, b, a] = currBreak
      if (rand < z) return [r, g, b, a]
    }
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
