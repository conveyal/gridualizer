const BreaksColorScale = (breaks, interpolate) => 
  (value) => {
    var currBreak, prevBreak
    prevBreak = breaks[0]
    for (currBreak of breaks) {
      if (value < currBreak[0]) {
        if (interpolate) {
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

export default BreaksColorScale
