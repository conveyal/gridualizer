/** React-leaflet component for rendering a Browsochrones Grid as raster map tiles. */

import GridTileLayer from '../grid-tile-layer'
import {MapLayer} from 'react-leaflet'
import {PropTypes} from 'react'

export default class ReactGridMapLayer extends MapLayer {
  // Interpolator should be a class name, which refers to that class's constructor function
  static propTypes = {
    grid: PropTypes.object.isRequired,
    interpolator: PropTypes.func.isRequired,
    colorizer: PropTypes.func.isRequired
  }

  componentWillMount () {
    super.componentWillMount()
    const { grid, interpolator, colorizer } = this.props
    this.leafletElement = new GridTileLayer(grid, interpolator, colorizer)
  }

  shouldComponentUpdate (nextProps) {
    const { grid, interpolator, colorizer } = this.props
    return grid !== nextProps.grid || colorizer !== nextProps.colorizer || interpolator !== nextProps.interpolator
  }

  componentDidUpdate () {
    this.layerContainer.removeLayer(this.leafletElement)
    const { grid, colorizer, interpolator } = this.props
    this.leafletElement = new GridTileLayer(grid, interpolator, colorizer)
    this.layerContainer.addLayer(this.leafletElement)
  }
}
