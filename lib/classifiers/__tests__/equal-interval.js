/* global describe, it, expect */

import {scaleLog} from 'd3-scale'
import range from 'lodash/range'

import equalInterval from '../equal-interval'

const mockGrid = {
  min: 0,
  max: 1000,
  data: range(0, 1001)
}

describe('classifiers > equal-interval', () => {
  it('should handle a linear classifier', () => {
    expect(equalInterval()(mockGrid, 5)).toMatchSnapshot()
  })

  it('should handle a nonlinear classifier', () => {
    const scale = scaleLog()
      .domain([1, 1000])
      .clamp(true)

    expect(equalInterval({ scale })(mockGrid, 5)).toMatchSnapshot()
  })
})
