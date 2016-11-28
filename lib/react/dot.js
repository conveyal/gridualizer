/** React-leaflet component for a choropleth map */

import Dot from '../dot'
import {MapLayer} from 'react-leaflet'
import {PropTypes} from 'react'

export default class ReactChoropleth extends MapLayer {
  static propTypes = {
    grid: PropTypes.object.isRequired,
    placement: PropTypes.func,
    color: PropTypes.string
  }

  componentWillMount () {
    super.componentWillMount()
    const { grid, placement, color } = this.props
    this.leafletElement = new Dot(grid, color, placement)
  }

  shouldComponentUpdate (nextProps) {
    const { grid, placement, color } = this.props
    return grid !== nextProps.grid || placement !== nextProps.placement || color !== nextProps.color
  }

  componentDidUpdate () {
    this.layerContainer.removeLayer(this.leafletElement)
    const { grid, placement, color } = this.props
    this.leafletElement = new Dot(grid, color, placement)
    this.layerContainer.addLayer(this.leafletElement)
  }
}
