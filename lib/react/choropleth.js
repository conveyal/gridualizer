/** React-leaflet component for a choropleth map */

import Choropleth from '../choropleth'
import {MapLayer} from 'react-leaflet'
import {PropTypes} from 'react'

export default class ReactChoropleth extends MapLayer {
  static propTypes = {
    grid: PropTypes.object.isRequired,
    breaks: PropTypes.func,
    colors: PropTypes.array
  }

  componentWillMount () {
    super.componentWillMount()
    const { grid, breaks, colors } = this.props
    this.leafletElement = new Choropleth(grid, breaks, colors)
  }

  componentDidUpdate () {
    this.layerContainer.removeLayer(this.leafletElement)
    const { grid, breaks, colors } = this.props
    this.leafletElement = new Choropleth(grid, breaks, colors)
    this.layerContainer.addLayer(this.leafletElement)
  }
}
