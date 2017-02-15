/** Assemble and export the package */

import GridTileLayerp from './grid-tile-layer'
import ReactGridMapLayerp from './react/grid-map-layer'
import equal from './classifiers/equal-interval'
import quantile from './classifiers/quantile'
import diverging from './classifiers/diverging'
import dither from './colorizers/dither.js'
import choropleth from './colorizers/choropleth.js'
import gradient from './colorizers/gradient.js'
import bicubic from './interpolators/bicubic'
import bilinear from './interpolators/bilinear'
import nearest from './interpolators/nearest'

export const GridTileLayer = GridTileLayerp
export const ReactGridMapLayer = ReactGridMapLayerp
export const classifiers = { equal, quantile, diverging }
export const colorizers = { dither, choropleth, gradient }
export const interpolators = { bicubic, bilinear, nearest }
