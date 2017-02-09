export class InterpolatingColorScale {

  // Pass in an array of [[z, r, g, b, a], [z, r, g, b, a], [z, r, g, b, a]...]
  constructor (breaks) {
    this.breaks = breaks
    this.interpolate = true
  }

  getColorForValue (value) {
    var currBreak, prevBreak
    prevBreak = this.breaks[0]
    for (currBreak of this.breaks) {
      if (value < currBreak[0]) {
        if (this.interpolate) {
          const [z0, r0, g0, b0, a0] = prevBreak
          const [z1, r1, g1, b1, a1] = currBreak
          const frac = (value - z0) / (z1 - z0)
          const r = r0 + (r1 - r0) * frac
          const g = g0 + (g1 - g0) * frac
          const b = b0 + (b1 - b0) * frac
          const a = a0 + (a1 - a0) * frac
          return [r, g, b, a]
        } else {
          const [z, r, g, b, a] = currBreak
          return [r, g, b, a]
        }        
      }
      prevBreak = currBreak
    }
    const [z, r, g, b, a] = prevBreak
    return [r, g, b, a]
  }
  
}

export class CutoffColorScale {

  // any value below cutoff will return the low color, 
  // any value above will return the high color.
  // colors are [r, g, b, a]
  constructor (cutoff, lowColor, highColor) {
    this.cutoff = cutoff
    this.lowColor = lowColor
    this.highColor = highColor
  }

  getColorForValue (value) {
    if (value < this.cutoff) return this.lowColor
    else return this.highColor
  }
  
}

// This one expects values to be small integers, so divide high densities down accordingly
export class DotColorScale {
  
  // The scale factor is how many people/jobs/whatever must be present to trigger one dot.
  constructor (color, scaleFactor) {
    this.color = color
    this.scaleFactor = scaleFactor
  }
  
  // Get a random number in [0, 1)
  // and plot a dot if that number is less than the number of things in this pixel.
  // We were using a JS Mersenne Twister, which was using 65% of CPU time according to a profiler.
  // Math.random uses an xorshift method in V8, dropping to 4% of CPU time.
  // Unlike other color scales, you might want this one to "dilute" as you zoom in, i.e. you might want to
  // account for on-screen density so the ratio of objects to dots remains constant.
  // In that case the caller should be scaling the parameter value by the total number of pixels in a tile. 
  // But it doesn't look that great in practice.
  getColorForValue (value) {
    value /= this.scaleFactor
    const r = Math.random()
    let opacity = 0
    if (r < value) {
      opacity = 63
      if (r * 2 < value) opacity += 64
      if (r * 3 < value) opacity += 64
      if (r * 4 < value) opacity += 64
    }
    return [...this.color, opacity]
  }

}

