/* global describe, it, expect */

import {getClassIndex} from '../choropleth'

describe('choropleth', () => {
  it('should compute breaks correctly', () => {
    const breaks = [10, 20, 30, 40]

    expect(getClassIndex(5, breaks)).toEqual(0) // below first break, first class
    expect(getClassIndex(25, breaks)).toEqual(2) // below breaks[2], which is 30
    expect(getClassIndex(30, breaks)).toEqual(2) // inclusive
    expect(getClassIndex(35, breaks)).toEqual(3)
    expect(getClassIndex(41, breaks)).toEqual(3) // clamp
  })
})
