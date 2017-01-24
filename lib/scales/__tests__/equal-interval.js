/* global describe, it, expect */

import {mockGrid} from '../../mock-data'
import equalInterval from '../equal-interval'
import {scaleLog} from 'd3-scale'

describe('scales > equal-interval', () => {
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
