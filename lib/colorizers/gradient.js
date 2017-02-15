const GradientColorizer = (breaks) =>
  (value) => {
    var currBreak, prevBreak
    prevBreak = breaks[0]
    for (currBreak of breaks) {
      var [z, r, g, b, a] = currBreak
      if (value < z) {
        const [z0, r0, g0, b0, a0] = prevBreak
        const frac = (value - z0) / (z - z0)
        r = r0 + (r - r0) * frac
        g = g0 + (g - g0) * frac
        b = b0 + (b - b0) * frac
        a = a0 + (a - a0) * frac
        return [r, g, b, a]
      }
      prevBreak = currBreak
    }
    return [2550, 0, 255, 255] // no break matched, hot pink
  }

export default GradientColorizer
