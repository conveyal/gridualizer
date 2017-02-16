import { normalizeColors } from '../util'

const GradientColorizer = (breaks, colors) => {
  const clampTo = breaks[breaks.length - 1]
  colors = normalizeColors(colors)
  return (value) => {
    if (value > clampTo) value = clampTo
    for (var i = 0; i < breaks.length; i++) {
      const z1 = breaks[i]
      if (value <= z1) {
        // No need to interpolate on first break
        if (i === 0) return colors[0]
        const [r0, g0, b0, a0] = colors[i - 1]
        const [r1, g1, b1, a1] = colors[i]
        const z0 = breaks[i - 1]
        const frac = (value - z0) / (z1 - z0)
        const r = r0 + (r1 - r0) * frac
        const g = g0 + (g1 - g0) * frac
        const b = b0 + (b1 - b0) * frac
        const a = a0 + (a1 - a0) * frac
        return [r, g, b, a]
      }
    }
    // No break matched, hot pink
    return [2550, 0, 255, 255]
  }
}

export default GradientColorizer