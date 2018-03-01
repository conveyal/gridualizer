'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _xorshift = require('xorshift');

/**
 * https://en.wikipedia.org/wiki/Jenks_natural_breaks_optimization
 * Algorithm implemented in Javascript by Tom McWright.
 * http://www.macwright.org/2013/02/18/literate-jenks.html
 */
var jenks = function jenks(_ref) {
  var _ref$noDataValue = _ref.noDataValue,
      noDataValue = _ref$noDataValue === undefined ? null : _ref$noDataValue;
  return function (grid, nBreaks) {
    // Use a sample of the data to make the Jenks optimization algorithm tractable.
    var sample = void 0;
    if (grid.data.length < 10000) {
      sample = grid.data.slice(0);
    } else {
      sample = new Int32Array(10000);
      var generator = new _xorshift.constructor([grid.west, grid.north, grid.width, grid.height]);
      for (var i = 0; i < 10000; i++) {
        sample[i] = grid.data[generator.random() * grid.data.length | 0];
      }
    }
    sample = sample.filter(function (i) {
      return i !== noDataValue;
    });
    // If you call simple-statistics Jenks breaks requesting N classes,
    // you'll receive N+1 breaks including the lower and upper ends.
    // We remove the initial lower boundary (our lower boundary is -inf).
    return ssJenks(sample, nBreaks).slice(1);
  };
};

exports.default = jenks;

/*

The code below this point is derived from simple-statistics project.
For some reason it's no longer included in that project, so I've copied it here.

Copyright (c) 2014, Tom MacWright

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.

*/

// Compute the matrices required for Jenks breaks. These matrices
// can be used for any classing of data with `classes <= nClasses`

var ssJenksMatrices = function ssJenksMatrices(data, nClasses) {
  // in the original implementation, these matrices are referred to
  // as `LC` and `OP`
  //
  // * lowerClassLimits (LC): optimal lower class limits
  // * varianceCombinations (OP): optimal variance combinations for all classes
  var lowerClassLimits = [];
  var varianceCombinations = [];
  // loop counters
  var i = void 0;
  var j = void 0;
  // the variance, as computed at each step in the calculation
  var variance = 0;

  // Initialize and fill each matrix with zeroes
  for (i = 0; i < data.length + 1; i++) {
    var tmp1 = [];
    var tmp2 = [];
    for (j = 0; j < nClasses + 1; j++) {
      tmp1.push(0);
      tmp2.push(0);
    }
    lowerClassLimits.push(tmp1);
    varianceCombinations.push(tmp2);
  }

  for (i = 1; i < nClasses + 1; i++) {
    lowerClassLimits[1][i] = 1;
    varianceCombinations[1][i] = 0;
    // in the original implementation, 9999999 is used but
    // since Javascript has `Infinity`, we use that.
    for (j = 2; j < data.length + 1; j++) {
      varianceCombinations[j][i] = Infinity;
    }
  }

  for (var l = 2; l < data.length + 1; l++) {
    // `SZ` originally. this is the sum of the values seen thus
    // far when calculating variance.
    var sum = 0;
    // `ZSQ` originally. the sum of squares of values seen
    // thus far
    var sumSquares = 0;
    // `WT` originally. This is the number of
    var w = 0;
    // `IV` originally
    var i4 = 0;

    // in several instances, you could say `Math.pow(x, 2)`
    // instead of `x * x`, but this is slower in some browsers
    // introduces an unnecessary concept.
    for (var m = 1; m < l + 1; m++) {
      // `III` originally
      var lowerClassLimit = l - m + 1;
      var val = data[lowerClassLimit - 1];

      // here we're estimating variance for each potential classing
      // of the data, for each potential number of classes. `w`
      // is the number of data points considered so far.
      w++;

      // increase the current sum and sum-of-squares
      sum += val;
      sumSquares += val * val;

      // the variance at this point in the sequence is the difference
      // between the sum of squares and the total x 2, over the number
      // of samples.
      variance = sumSquares - sum * sum / w;

      i4 = lowerClassLimit - 1;

      if (i4 !== 0) {
        for (j = 2; j < nClasses + 1; j++) {
          if (varianceCombinations[l][j] >= variance + varianceCombinations[i4][j - 1]) {
            lowerClassLimits[l][j] = lowerClassLimit;
            varianceCombinations[l][j] = variance + varianceCombinations[i4][j - 1];
          }
        }
      }
    }

    lowerClassLimits[l][1] = 1;
    varianceCombinations[l][1] = variance;
  }

  return {
    lowerClassLimits: lowerClassLimits,
    varianceCombinations: varianceCombinations
  };
};

var ssJenks = function ssJenks(data, nClasses) {
  // sort data in numerical order
  data = data.slice().sort(function (a, b) {
    return a - b;
  });

  // get our basic matrices
  var matrices = ssJenksMatrices(data, nClasses);
  // we only need lower class limits here
  var lowerClassLimits = matrices.lowerClassLimits;
  var k = data.length - 1;
  var kclass = [];
  var countNum = nClasses;

  // the calculation of classes will never include the upper and
  // lower bounds, so we need to explicitly set them
  kclass[nClasses] = data[data.length - 1];
  kclass[0] = data[0];

  // the lowerClassLimits matrix is used as indexes into itself
  // here: the `k` variable is reused in each iteration.
  while (countNum > 1) {
    kclass[countNum - 1] = data[lowerClassLimits[k][countNum] - 2];
    k = lowerClassLimits[k][countNum] - 1;
    countNum--;
  }
  return kclass;
};
module.exports = exports['default'];

//# sourceMappingURL=jenks.js