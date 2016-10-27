/** React-leaflet component for a choropleth map */

import Choropleth from '../choropleth'
import {MapLayer} from 'react-leaflet'
import {PropTypes} from 'react'

export default class ReactChoropleth extends MapLayer {
  static propTypes = {
    grid: PropTypes.object.isRequired,
    breaks: PropTypes.func,
    colors: PropTypes.array,
    labels: PropTypes.number
  }

  componentWillMount () {
    super.componentWillMount()
    const { grid, breaks, colors, labels } = this.props
    this.leafletElement = new Choropleth(grid, breaks, colors, labels)
  }

  shouldComponentUpdate (nextProps) {
    const { grid, breaks, colors } = this.props

    // deep equal the colors
    let colorsEqual = colors === nextProps.colors

    if (!colorsEqual && colors != null && nextProps.colors != null) {
      if (colors.length === nextProps.colors.length) {
        // if we find no colors that don't equal each other, set colorsEqual=true
        // colorsEqual is already false
        colorsEqual = colors.find((c, i) => colors[i] !== nextProps.colors[i]) === undefined
      }
    }

    return grid !== nextProps.grid || breaks !== nextProps.breaks || !colorsEqual
  }

  componentDidUpdate () {
    this.layerContainer.removeLayer(this.leafletElement)
    const { grid, breaks, colors, labels } = this.props
    this.leafletElement = new Choropleth(grid, breaks, colors, labels)
    this.layerContainer.addLayer(this.leafletElement)
  }
}
