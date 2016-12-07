/**
 * a demo of gridualizer. Pulls down a grid checked into the repository, and allows you to change visualizations
 */

import React, { Component } from 'react'
import { Map as LeafletMap, TileLayer } from 'react-leaflet'
import Control from 'react-leaflet-control'
import { Browser } from 'leaflet'
import {ReactChoropleth, ReactDot, Choropleth} from './lib'
import {createGrid} from 'browsochrones'
import { render } from 'react-dom'

const DOT = 'dot'
const CHOROPLETH_QUANTILE = 'choropleth quantile'
const CHOROPLETH_EQUAL = 'choropleth equal'
const NYC_HUDSON_STREET = [40.73535, -74.00630]
// const KC_HOSPITAL_HILL = [39.08333, -94.575]

export default class GridualizerExample extends Component {
  state = {
    type: DOT,
    grid: null
  }

  selectDot = (e) => {
    this.setState({ ...this.state, type: DOT })
  }

  selectChoroplethQuantile = (e) => {
    this.setState({ ...this.state, type: CHOROPLETH_QUANTILE })
  }

  selectChoroplethEqual = (e) => {
    this.setState({ ...this.state, type: CHOROPLETH_EQUAL })
  }

  async componentWillMount () {
    const raw = await window.fetch('/example.grid').then(res => res.arrayBuffer())
    this.setState({...this.state, grid: createGrid(raw)})
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
          <button onClick={this.selectDot} disabled={this.state.type === DOT}>Dot</button>
          <button onClick={this.selectChoroplethQuantile} disabled={this.state.type === CHOROPLETH_QUANTILE}>Choropleth, quantile</button>
          <button onClick={this.selectChoroplethEqual} disabled={this.state.type === CHOROPLETH_EQUAL}>Choropleth, equal</button>
        </div>
      </Control>
    </LeafletMap>
  }

  renderGrid () {
    switch (this.state.type) {
      case DOT:
        return <ReactDot
          grid={this.state.grid}
          color='rgb(194, 201, 215)' />
      case CHOROPLETH_QUANTILE:
        return <ReactChoropleth
          grid={this.state.grid}
          breaks={Choropleth.quantile({})}
          colors={['#f1eef6', '#bdc9e1', '#74a9cf', '#2b8cbe', '#045a8d']}
          labels={16} />
      case CHOROPLETH_EQUAL:
        return <ReactChoropleth
          grid={this.state.grid}
          breaks={Choropleth.equal({})}
          colors={['#f1eef6', '#bdc9e1', '#74a9cf', '#2b8cbe', '#045a8d']}
          labels={16} />
    }
  }
}

render(<GridualizerExample />, document.getElementById('root'))
