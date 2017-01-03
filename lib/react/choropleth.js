/** React-leaflet component for a choropleth map */

import Choropleth from '../choropleth'
import {MapLayer} from 'react-leaflet'
import {PropTypes} from 'react'

export default class ReactChoropleth extends MapLayer {
  static propTypes = {
    grid: PropTypes.object.isRequired,
    breaks: PropTypes.func,
    colors: PropTypes.array,
    labels: PropTypes.number,
    noDataValue: PropTypes.number,
    opacity: PropTypes.number
  }

  componentWillMount () {
    super.componentWillMount()
    this.leafletElement = new Choropleth(this.props)
  }

  shouldComponentUpdate (nextProps) {
    const { grid, breaks, colors, noDataValue } = this.props

    // deep equal the colors
    let colorsEqual = colors === nextProps.colors

    if (!colorsEqual && colors != null && nextProps.colors != null) {
      if (colors.length === nextProps.colors.length) {
        // if we find no colors that don't equal each other, set colorsEqual=true
        // colorsEqual is already false
        colorsEqual = colors.find((c, i) => colors[i] !== nextProps.colors[i]) === undefined
      }
    }

    return grid !== nextProps.grid ||
      breaks !== nextProps.breaks ||
      nextProps.noDataValue !== noDataValue ||
      !colorsEqual
  }

  componentDidUpdate () {
    this.layerContainer.removeLayer(this.leafletElement)
    this.leafletElement = new Choropleth(this.props)
    this.layerContainer.addLayer(this.leafletElement)
  }
}
