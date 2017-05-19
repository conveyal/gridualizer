/**
 * This dot colorizer ignores the list of color breaks.
 * The caller should pass in a probability in the range [0..1] that this will draw a dot.
 * In our use, this probability is constrained so on average each dot represents a number of 
 * opportunities greater than one.
 */
const DotColorizer = (breaks, colors) => {
  var colorizer = (density) => {
    // Highlight outliers that are probably bad input data 
    if (density > 2) return [255, 0, 0, 200]
    //if (density >= 1) return [0, 0, 0, 200]
    const r = Math.random() // range 0..1
    if (r < density) return [0, 0, 0, 200]
    else return [0, 0, 0, 0]
  }
  // Indicate to callers that this colorizer expects its inputs to be normalized to the range [0..1]
  colorizer.normalize = true
  return colorizer
}

export default DotColorizer
