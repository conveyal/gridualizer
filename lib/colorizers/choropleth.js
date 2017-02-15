const ChoroplethColorizer = (breaks) =>
  (value) => {
    for (const currBreak of breaks) {
      const [z, r, g, b, a] = currBreak
      if (value < z) return [r, g, b, a]
    }
    return [2550, 0, 255, 255] // no break matched, hot pink
  }

export default ChoroplethColorizer
