/** Assemble and export the package */

import Choroplethp from './choropleth'
import ReactChoroplethp from './react/choropleth'
import Dotp from './dot'
import ReactDotp from './react/dot'
import equal from './scales/equal-interval'
import quantile from './scales/quantile'
import diverging from './scales/diverging'

export const Choropleth = Choroplethp
export const ReactChoropleth = ReactChoroplethp
export const Dot = Dotp
export const ReactDot = ReactDotp
export const scales = { equal, quantile, diverging }
