'use strict';

var _choropleth = require('../choropleth');

describe('choropleth', function () {
  it('should compute breaks correctly', function () {
    var breaks = [10, 20, 30, 40];

    expect((0, _choropleth.getClassIndex)(5, breaks)).toEqual(0); // below first break, first class
    expect((0, _choropleth.getClassIndex)(25, breaks)).toEqual(2); // below breaks[2], which is 30
    expect((0, _choropleth.getClassIndex)(30, breaks)).toEqual(2); // inclusive
    expect((0, _choropleth.getClassIndex)(35, breaks)).toEqual(3);
    expect((0, _choropleth.getClassIndex)(41, breaks)).toEqual(3); // clamp
  });
}); /* global describe, it, expect */

//# sourceMappingURL=choropleth.js