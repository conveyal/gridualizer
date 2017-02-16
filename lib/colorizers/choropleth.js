import { normalizeColors } from '../util'

const ChoroplethColorizer = (breaks, colors) => {
  const clampTo = breaks[breaks.length - 1]
  colors = normalizeColors(colors)
  return (value) => {
    if (value > clampTo) value = clampTo
    for (var i = 0; i < breaks.length; i++) {
      const z = breaks[i]
      if (value <= z) return colors[i]
    }
    // No break matched, hot pink.
    return [2550, 0, 255, 255]
  }
}

export default ChoroplethColorizer
