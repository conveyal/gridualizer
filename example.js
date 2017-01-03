/**
 * a demo of gridualizer. Pulls down a grid checked into the repository, and allows you to change visualizations
 */

import React, {Component, PropTypes} from 'react'
import {Map, TileLayer, GridLayer} from 'react-leaflet'
import Control from 'react-leaflet-control'
import {breaks, Choropleth, Dot} from './lib'
import {createGrid} from 'browsochrones'
import {render} from 'react-dom'

const DOT = 'dot'
const CHOROPLETH_QUANTILE = 'choropleth quantile'
const CHOROPLETH_EQUAL = 'choropleth equal'
const NYC_HUDSON_STREET = [40.73535, -74.00630]
// const KC_HOSPITAL_HILL = [39.08333, -94.575]

const CHORO_COLORS = ['#f1eef6', '#bdc9e1', '#74a9cf', '#2b8cbe', '#045a8d']

class CanvasLayer extends GridLayer {
  propTypes: {
    createTile: PropTypes.func.isRequired
  }

  componentWillMount () {
    super.componentWillMount()
    this.leafletElement.createTile = this.props.createTile
  }

  componentDidUpdate (prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState)
    this.leafletElement.createTile = this.props.createTile
    this.leafletElement.redraw()
  }
}

class GridualizerExample extends Component {
  state = {
    createTile: false,
    type: DOT
  }

  selectDot = (e) => {
    this.setState({
      ...this.state,
      createTile: this.dot.createTile,
      type: DOT
    })
  }

  selectChoroplethQuantile = (e) => {
    this.setState({
      ...this.state,
      createTile: this.choroplethQuantile.createTile,
      type: CHOROPLETH_QUANTILE
    })
  }

  selectChoroplethEqual = (e) => {
    this.setState({
      ...this.state,
      createTile: this.choroplethEqual.createTile,
      type: CHOROPLETH_EQUAL
    })
  }

  async componentWillMount () {
    const raw = await window.fetch('/example.grid').then(res => res.arrayBuffer())
    const grid = createGrid(raw)
    this.dot = new Dot({grid, color: 'rgb(194, 201, 215)'})
    this.choroplethEqual = new Choropleth({grid, colors: CHORO_COLORS, labels: 16})
    this.choroplethQuantile = new Choropleth({grid, breaks: breaks.quantile(), colors: CHORO_COLORS, labels: 16})
    this.setState({
      ...this.state,
      createTile: this.dot.createTile
    })
  }

  render () {
    console.log('render', this.state)
    return (
      <Map center={NYC_HUDSON_STREET} zoom={12}>
        <TileLayer
          url={'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png'}
          attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        {this.state.createTile && <CanvasLayer createTile={this.state.createTile} />}
        <Control position='topright'>
          <div>
            <button onClick={this.selectDot} disabled={this.state.type === DOT}>Dot</button>
            <button onClick={this.selectChoroplethQuantile} disabled={this.state.type === CHOROPLETH_QUANTILE}>Choropleth, quantile</button>
            <button onClick={this.selectChoroplethEqual} disabled={this.state.type === CHOROPLETH_EQUAL}>Choropleth, equal</button>
          </div>
        </Control>
      </Map>
    )
  }
}

render(<GridualizerExample />, document.getElementById('root'))
