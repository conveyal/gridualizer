// This one expects values to be small integers, so divide high densities down accordingly
// The scale factor is how many people/jobs/whatever must be present to trigger one dot.
const DotsColorScale = (color, scaleFactor) =>
  (value) => {
    // Get a random number in [0, 1)
    // and plot a dot if that number is less than the number of things in this pixel.
    // We were using a JS Mersenne Twister, which was using 65% of CPU time according to a profiler.
    // Math.random uses an xorshift method in V8, dropping to 4% of CPU time.
    // Unlike other color scales, you might want this one to "dilute" as you zoom in, i.e. you might want to
    // account for on-screen density so the ratio of objects to dots remains constant.
    // In that case the caller should be scaling the parameter value by the total number of pixels in a tile.
    // But it doesn't look that great in practice.
    value /= scaleFactor
    const r = Math.random()
    let opacity = 0
    if (r < value) {
      opacity = 63
      if (r * 2 < value) opacity += 64
      if (r * 3 < value) opacity += 64
      if (r * 4 < value) opacity += 64
    }
    return [...color, opacity]
  }

export default DotsColorScale
