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

  deStijlColors = [
    'rgba(0, 0, 200, 0.0)',
    'rgba(0, 0, 200, 0.5)',
    'rgba(200, 0, 0, 0.5)',
    'rgba(200, 200, 0, 0.5)'
  ]

  blueOpacityColors = [
    'rgba(0, 0, 200, 0.0)',
    'rgba(0, 0, 200, 0.2)',
    'rgba(0, 0, 200, 0.4)',
    'rgba(0, 0, 200, 0.8)'
  ]

  originalColors = [
    'rgba(241, 237, 246, 0.5)',
    'rgba(188, 200, 224, 0.5)',
    'rgba(116, 169, 207, 0.5)',
    'rgba(  4,  90, 142, 0.5)'
  ]

  // Initial state
  state = {
    grid: null,
    interpolator: interpolators.bicubic,
    colors: this.blueOpacityColors,
    colorizer: colorizers.choropleth
  }

  selectDeStijlColors = (e) => {
    this.setState({ ...this.state, colors: this.deStijlColors })
  }

  selectBlueOpacityColors = (e) => {
    this.setState({ ...this.state, colors: this.blueOpacityColors })
  }

  selectOriginalColors = (e) => {
    this.setState({ ...this.state, colors: this.originalColors })
  }

  selectNearest = (e) => {
    this.setState({ ...this.state, interpolator: interpolators.nearest })
  }

  selectBicubic = (e) => {
    this.setState({ ...this.state, interpolator: interpolators.bicubic })
  }

  selectSpline = (e) => {
    this.setState({ ...this.state, interpolator: interpolators.spline })
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
  ckmeansClassifier = classifiers.ckmeans({})
  // Applying a scale to a quantile classifier would make no difference, so it takes no scale configuration.
  // Exclude the huge number of zeros from the classification.
  quantileClassifier = classifiers.quantile({noDataValue: 0})
  // The equal interval classifier defaults to linear scale when constructed with no scale.
  linEqualClassifier = classifiers.equal({})
  // Setting up a log scale must wait until the grid is loaded.
  logEqualClassifier = null

  setClassifierState = (classifier) => {
    // Use the classifier to materialize as many break points as we have colors.
    // We have redundant state here: the classifier function and the result of the classification (breaks).
    // Classification can be slow, so we want to keep the breaks in the state to avoid re-classifying every time
    // we render the component. But it's also useful to keep the function itself, to decide which button to disable.
    // It would be better if classification were asynchronous since it can be slow.
    this.setState({
      ...this.state,
      classifier: classifier,
      breaks: classifier(this.state.grid, this.state.colors.length)
    })
  }

  selectCustom = (e) => {
    this.setClassifierState(this.customClassifier)
  }

  selectCkmeans = (e) => {
    this.setClassifierState(this.ckmeansClassifier)
  }

  selectQuantile = (e) => {
    this.setClassifierState(this.quantileClassifier)
  }

  selectLinEqual = (e) => {
    this.setClassifierState(this.linEqualClassifier)
  }

  selectLogEqual = (e) => {
    this.setClassifierState(this.logEqualClassifier)
  }

  async componentWillMount () {
    this.selectCustom() // Note that this one does not depend on the grid being loaded.
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
          <label>Colors:</label>
          <button onClick={this.selectDeStijlColors}
            disabled={this.state.colors === this.deStijlColors}>De Stijl</button>
          <button onClick={this.selectBlueOpacityColors}
            disabled={this.state.colors === this.blueOpacityColors}>Blue Opacity</button>
          <button onClick={this.selectOriginalColors}
            disabled={this.state.colors === this.originalColors}>Original</button>
          <br />
          <label>Interpolator:</label>
          <button onClick={this.selectNearest}
            disabled={this.state.interpolator === interpolators.nearest}>Nearest</button>
          <button onClick={this.selectBilinear}
            disabled={this.state.interpolator === interpolators.bilinear}>Bilinear</button>
          <button onClick={this.selectBicubic}
            disabled={this.state.interpolator === interpolators.bicubic}>Bicubic</button>
          <button onClick={this.selectSpline}
            disabled={this.state.interpolator === interpolators.spline}>Spline</button>
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
          <button onClick={this.selectCkmeans}
            disabled={this.state.classifier === this.ckmeansClassifier}>Ckmeans</button>
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
    return <ReactGridMapLayer
      grid={this.state.grid}
      interpolator={this.state.interpolator}
      colorizer={this.state.colorizer(this.state.breaks, this.state.colors)} />
  }
}

render(<GridualizerExample />, document.getElementById('root'))
