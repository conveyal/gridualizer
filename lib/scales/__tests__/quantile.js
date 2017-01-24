/* global describe, it, expect */

import quantile from '../quantile'

describe('scales > quantile', () => {
  it('should work', () => {
    const data = new Int32Array(1000)
    // spread into 10 classes evenly
    for (let i = 0; i < data.length; i++) data[i] = i % 10
    expect(quantile({})({ data, min: 0, max: 9 }, 5)).toEqual([2, 4, 6, 8, 9])
  })

  it('should handle no data value', () => {
    const data = new Int32Array(1000)
    // spread into 5 classes evenly
    for (let i = 0; i < data.length; i++) data[i] = i % 5
    // 3, 4 because 4 is the max, and there are as many values < 3 as there are >= 3, because 2 is excluded
    expect(quantile({ noDataValue: 2 })({ data, min: 0, max: 4 }, 2)).toEqual([3, 4])
  })
})
