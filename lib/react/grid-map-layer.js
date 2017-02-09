/** React-leaflet component for rendering a Browsochrones Grid as raster map tiles. */

import GridTileLayer from '../grid-tile-layer'
import {MapLayer} from 'react-leaflet'
import {PropTypes} from 'react'

export default class ReactGridMapLayer extends MapLayer {
    
  // Interpolator should be a class name, which refers to that class's constructor function
  static propTypes = {
    grid: PropTypes.object.isRequired,
    colorScale: PropTypes.object.isRequired,
    interpolator: PropTypes.func.isRequired 
  }

  componentWillMount () {
    super.componentWillMount()
    const { grid, colorScale, interpolator } = this.props
    this.leafletElement = new GridTileLayer(grid, colorScale, interpolator)
  }

  shouldComponentUpdate (nextProps) {
    const { grid, colorScale, interpolator } = this.props
    return grid !== nextProps.grid || colorScale !== nextProps.colorScale || interpolator !== nextProps.interpolator
  }

  componentDidUpdate () {
    this.layerContainer.removeLayer(this.leafletElement)
    const { grid, colorScale, interpolator } = this.props
    this.leafletElement = new GridTileLayer(grid, colorScale, interpolator)
    this.layerContainer.addLayer(this.leafletElement)
  }

}
