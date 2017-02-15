/**
 * a demo of gridualizer. Pulls down a grid checked into the repository, and allows you to change visualizations
 */

import React, { Component } from 'react'
import { Map as LeafletMap, TileLayer } from 'react-leaflet'
import Control from 'react-leaflet-control'
import { Browser } from 'leaflet'
import { ReactGridMapLayer, interpolators, colorizers, classifiers } from './lib'
import { createGrid } from 'browsochrones'
import { render } from 'react-dom'
import { scaleLog } from 'd3-scale'

const NYC_HUDSON_STREET = [40.73535, -74.00630]
// const KC_HOSPITAL_HILL = [39.08333, -94.575]

export default class GridualizerExample extends Component {

  // Initial Redux state
  state = {
    grid: null
  }

  selectNearest = (e) => {
    this.setState({ ...this.state, interpolator: interpolators.nearest })
  }

  selectBicubic = (e) => {
    this.setState({ ...this.state, interpolator: interpolators.bicubic })
  }

  selectBilinear = (e) => {
    this.setState({ ...this.state, interpolator: interpolators.bilinear })
  }

  selectChoropleth = (e) => {
    this.setState({ ...this.state, colorizer: colorizers.choropleth })
  }

  selectGradient = (e) => {
    this.setState({ ...this.state, colorizer: colorizers.gradient })
  }

  selectDither = (e) => {
    this.setState({ ...this.state, colorizer: colorizers.dither })
  }

  // A hand-tweaked hard-wired classifier as a default
  customClassifier = () => [1500, 10000, 20000, 35000]
  jenksClassifier = classifiers.jenks({})
  // Applying a scale to a quantile classifier would make no difference, so it takes no scale configuration.
  // Exclude the huge number of zeros from the classification.
  quantileClassifier = classifiers.quantile({noDataValue: 0})
  // The equal interval classifier defaults to linear scale when constructed with no scale.
  linEqualClassifier = classifiers.equal({})
  // Setting up a log scale must wait until the grid is loaded.
  logEqualClassifier = null

  selectCustom = (e) => {
    this.setState({ ...this.state, classifier: this.customClassifier })
  }

  selectJenks = (e) => {
    this.setState({ ...this.state, classifier: this.jenksClassifier })
  }

  selectQuantile = (e) => {
    this.setState({ ...this.state, classifier: this.quantileClassifier })
  }

  selectLinEqual = (e) => {
    this.setState({ ...this.state, classifier: this.linEqualClassifier })
  }

  selectLogEqual = (e) => {
    this.setState({ ...this.state, classifier: this.logEqualClassifier })
  }

  async componentWillMount () {
    this.selectBicubic()
    this.selectChoropleth()
    this.selectCustom()
    const raw = await window.fetch('/example.grid').then(res => res.arrayBuffer())
    this.setState({ ...this.state, grid: createGrid(raw) })
    // The log scale depends on knowing the range of the grid, which is now loaded.
    this.logEqualClassifier = classifiers.equal({
      scale: scaleLog().domain([1, this.state.grid.max]).clamp(true)
    })
  }

  render () {
    return <LeafletMap center={NYC_HUDSON_STREET} zoom={12}>
      <TileLayer
        url={Browser.retina
          ? 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png'
          : 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'}
        attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' />
      {this.state.grid && this.renderGrid()}
      <Control position='topright'>
        <div>
          <label>Interpolator:</label>
          <button onClick={this.selectNearest}
            disabled={this.state.interpolator === interpolators.nearest}>Nearest</button>
          <button onClick={this.selectBilinear}
            disabled={this.state.interpolator === interpolators.bilinear}>Bilinear</button>
          <button onClick={this.selectBicubic}
            disabled={this.state.interpolator === interpolators.bicubic}>Bicubic</button>
          <br />
          <label>Colorizer:</label>
          <button onClick={this.selectChoropleth}
            disabled={this.state.colorizer === colorizers.choropleth}>Choropleth</button>
          <button onClick={this.selectGradient}
            disabled={this.state.colorizer === colorizers.gradient}>Gradient</button>
          <button onClick={this.selectDither}
            disabled={this.state.colorizer === colorizers.dither}>Dither</button>
          <br />
          <label>Classifier:</label>
          <button onClick={this.selectCustom}
            disabled={this.state.classifier === this.customClassifier}>Custom</button>
          <button onClick={this.selectJenks}
            disabled={this.state.classifier === this.jenksClassifier}>Jenks</button>
          <button onClick={this.selectQuantile}
            disabled={this.state.classifier === this.quantileClassifier}>Quantile</button>
          <button onClick={this.selectLinEqual}
            disabled={this.state.classifier === this.linEqualClassifier}>Equal Interval (Lin)</button>
          <button onClick={this.selectLogEqual}
            disabled={this.state.classifier === this.logEqualClassifier}>Equal Interval (Log)</button>
        </div>
      </Control>
    </LeafletMap>
  }

  renderGrid () {
    const colors = [
      [0, 0, 200, 0],
      [0, 0, 200, 200],
      [200, 0, 0, 200],
      [200, 200, 0, 200]
    ]
    // const colors={[
    //   'rgba(241, 237, 246, 0.42)',
    //   'rgba(188, 200, 224, 0.42)',
    //   'rgba(116, 169, 207, 0.42)',
    //   'rgba( 43, 140, 190, 0.42)',
    //   'rgba(  4,  90, 142, 0.42)'
    // ]}
    // Convert from D3 color format to standard
    // const normalizedColors = colors.map(c => color(c).rgb())
    // Use the classifier to materialze as many break points as we have colors
    const breaks = this.state.classifier(this.state.grid, colors.length)
    return <ReactGridMapLayer
      grid={this.state.grid}
      interpolator={this.state.interpolator}
      colorizer={this.state.colorizer(breaks, colors)} />
  }

}

render(<GridualizerExample />, document.getElementById('root'))
