/* global describe, it, expect */

import diverging from '../diverging'
import equal from '../equal-interval'

describe('scales > diverging', () => {
  it('should work', () => {
    const data = new Int32Array(900)
    // yields even dispersion between -4 and +4
    for (let i = 0; i < 900; i++) data[i] = i % 9 - 4

    expect(diverging({
      scheme: equal,
      center: 0
    })({
      data,
      max: 4,
      min: -4
    }, 3)).toEqual([-2, 2, 4])
  })
})
