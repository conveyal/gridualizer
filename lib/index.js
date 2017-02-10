/** Assemble and export the package */

import Choroplethp from './choropleth'
import ReactChoroplethp from './react/choropleth'
import GridTileLayerp from './grid-tile-layer'
import ReactGridMapLayerp from './react/grid-map-layer'
import equal from './classifiers/equal-interval'
import quantile from './classifiers/quantile'
import diverging from './classifiers/diverging'

export const Choropleth = Choroplethp
export const ReactChoropleth = ReactChoroplethp
export const GridTileLayer = GridTileLayerp
export const ReactGridMapLayer = ReactGridMapLayerp
export const classifiers = { equal, quantile, diverging }
