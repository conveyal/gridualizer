// @flow
/**
 * a demo of gridualizer. Pulls down a grid checked into the repository, and allows you to change visualizations
 */

import React, {Component} from 'react'
import {Map as LeafletMap, MapLayer, TileLayer} from 'react-leaflet'
import Control from 'react-leaflet-control'
import {Browser, GridLayer} from 'leaflet'
import {createGrid} from 'browsochrones'
import {render} from 'react-dom'
import {scaleLog} from 'd3-scale'

import classifiers from './lib/classifiers'
import colorizers from './lib/colorizers'
import createDrawTile from './lib/create-draw-tile'
import interpolators from './lib/interpolators'

type Props = {
  colorizer(): void,
  grid: {},
  interpolator(): void
}

class ReactGridMapLayer extends MapLayer<void, Props, void> {
  createLeafletElement (props: Props): Object {
    const gridLayer = new GridLayer()
    gridLayer.createTile = this.createTile
    return gridLayer
  }

  componentDidUpdate (prevProps: Props, prevState) {
    this.leafletElement.redraw()
  }

  createTile = (coords) => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 256
    createDrawTile(this.props)(canvas, coords, coords.z)
    return canvas
  }
}

const NYC_HUDSON_STREET = [40.73535, -74.00630]
// const KC_HOSPITAL_HILL = [39.08333, -94.575]

const deStijlColors = [
  'rgba(0, 0, 200, 0.0)',
  'rgba(0, 0, 200, 0.5)',
  'rgba(200, 0, 0, 0.5)',
  'rgba(200, 200, 0, 0.5)'
]

const blueOpacityColors = [
  'rgba(0, 0, 200, 0.0)',
  'rgba(0, 0, 200, 0.2)',
  'rgba(0, 0, 200, 0.4)',
  'rgba(0, 0, 200, 0.8)'
]

const originalColors = [
  'rgba(241, 237, 246, 0.5)',
  'rgba(188, 200, 224, 0.5)',
  'rgba(116, 169, 207, 0.5)',
  'rgba(  4,  90, 142, 0.5)'
]

export default class GridualizerExample extends Component {
  // A hand-tweaked hard-wired classifier as a default
  customClassifier = () => [1500, 10000, 20000, 35000]
  ckmeansClassifier = classifiers.ckmeans({})
  // Applying a scale to a quantile classifier would make no difference, so it takes no scale configuration.
  // Exclude the huge number of zeros from the classification.
  quantileClassifier = classifiers.quantile({noDataValue: 0})
  // The equal interval classifier defaults to linear scale when constructed with no scale.
  linEqualClassifier = classifiers.equal({})
  // Setting up a log scale must wait until the grid is loaded.
  logEqualClassifier = classifiers.equal({
    scale: scaleLog().domain([1, this.props.grid.max]).clamp(true)
  })

  // Initial state
  state = {
    breaks: this.customClassifier(this.props.grid, blueOpacityColors.length),
    classifier: this.ckmeansClassifier,
    colors: blueOpacityColors,
    colorizer: colorizers.choropleth,
    interpolator: interpolators.bicubic
  }

  selectDeStijlColors = () => this.setState({colors: deStijlColors})
  selectBlueOpacityColors = () => this.setState({colors: blueOpacityColors})
  selectOriginalColors = () => this.setState({colors: originalColors})
  selectNearest = () => this.setState({interpolator: interpolators.nearest})
  selectBicubic = () => this.setState({interpolator: interpolators.bicubic})
  selectSpline = () => this.setState({interpolator: interpolators.spline})
  selectBilinear = () => this.setState({interpolator: interpolators.bilinear})
  selectChoropleth = () => this.setState({colorizer: colorizers.choropleth})
  selectGradient = () => this.setState({colorizer: colorizers.gradient})
  selectDither = () => this.setState({colorizer: colorizers.dither})
  selectDot = () => this.setState({colorizer: colorizers.dot})

  setClassifierState = (classifier: (Object, number) => number[]) => {
    // Use the classifier to materialize as many break points as we have colors.
    // We have redundant state here: the classifier function and the result of the classification (breaks).
    // Classification can be slow, so we want to keep the breaks in the state to avoid re-classifying every time
    // we render the component. But it's also useful to keep the function itself, to decide which button to disable.
    // It would be better if classification were asynchronous since it can be slow.
    this.setState({
      classifier,
      breaks: classifier(this.props.grid, this.state.colors.length)
    })
  }

  selectCustom = () => this.setClassifierState(this.customClassifier)
  selectCkmeans = () => this.setClassifierState(this.ckmeansClassifier)
  selectQuantile = () => this.setClassifierState(this.quantileClassifier)
  selectLinEqual = () => this.setClassifierState(this.linEqualClassifier)
  selectLogEqual = () => this.setClassifierState(this.logEqualClassifier)

  render () {
    const {classifier, colors, interpolator} = this.state
    return <LeafletMap center={NYC_HUDSON_STREET} zoom={12}>
      <TileLayer
        url={Browser.retina
          ? 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png'
          : 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'}
        attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>' />
      {this.props.grid &&
        <ReactGridMapLayer
          grid={this.props.grid}
          interpolator={interpolator}
          colorizer={this.state.colorizer(this.state.breaks, colors)}
          />}
      <Control position='topright'>
        <div>
          <fieldset>
            <legend>Colors:</legend>
            <button
              onClick={this.selectDeStijlColors}
              disabled={colors === deStijlColors}>De Stijl</button>
            <button
              onClick={this.selectBlueOpacityColors}
              disabled={colors === blueOpacityColors}>Blue Opacity</button>
            <button
              onClick={this.selectOriginalColors}
              disabled={colors === originalColors}>Original</button>
          </fieldset>
          <fieldset>
            <legend>Interpolator:</legend>
            <button onClick={this.selectNearest}
              disabled={interpolator === interpolators.nearest}>Nearest</button>
            <button onClick={this.selectBilinear}
              disabled={interpolator === interpolators.bilinear}>Bilinear</button>
            <button onClick={this.selectBicubic}
              disabled={interpolator === interpolators.bicubic}>Bicubic</button>
            <button onClick={this.selectSpline}
              disabled={interpolator === interpolators.spline}>Spline</button>
          </fieldset>
          <fieldset>
            <legend>Colorizer:</legend>
            <button onClick={this.selectChoropleth}
              disabled={this.state.colorizer === colorizers.choropleth}>Choropleth</button>
            <button onClick={this.selectGradient}
              disabled={this.state.colorizer === colorizers.gradient}>Gradient</button>
            <button onClick={this.selectDither}
              disabled={this.state.colorizer === colorizers.dither}>Dither</button>
            <button onClick={this.selectDot}
              disabled={this.state.colorizer === colorizers.dot}>Dot</button>
          </fieldset>
          <fieldset>
            <legend>Classifier:</legend>
            <button
              disabled={classifier === this.customClassifier}
              onClick={this.selectCustom}>Custom</button>
            <button
              disabled={classifier === this.ckmeansClassifier}
              onClick={this.selectCkmeans}>Ckmeans</button>
            <button
              disabled={classifier === this.quantileClassifier}
              onClick={this.selectQuantile}>Quantile</button>
            <button
              disabled={classifier === this.linEqualClassifier}
              onClick={this.selectLinEqual}>Equal Interval (Lin)</button>
            <button
              disabled={classifier === this.logEqualClassifier}
              onClick={this.selectLogEqual}>Equal Interval (Log)</button>
          </fieldset>
        </div>
      </Control>
    </LeafletMap>
  }
}

window
  .fetch('/example.grid')
  .then(res => res.arrayBuffer())
  .then((raw) => {
    render(
      <GridualizerExample grid={createGrid(raw)} />,
      document.getElementById('root')
    )
  })
