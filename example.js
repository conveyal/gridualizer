/**
 * a demo of gridualizer. Pulls down a grid checked into the repository, and allows you to change visualizations
 */

import React, { Component } from 'react'
import { Map as LeafletMap, TileLayer } from 'react-leaflet'
import Control from 'react-leaflet-control'
import { Browser } from 'leaflet'
import {ReactChoropleth, ReactDot, scales} from './lib'
import {createGrid} from 'browsochrones'
import { render } from 'react-dom'
import { scaleLog } from 'd3-scale'

const DOT = 'dot'
const CHOROPLETH_QUANTILE = 'choropleth quantile'
const CHOROPLETH_EQUAL = 'choropleth equal'
const CHOROPLETH_LOG = 'choropleth log'
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

  selectChoroplethLog = (e) => this.setState({ ...this.state, type: CHOROPLETH_LOG })

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
          <button onClick={this.selectChoroplethLog} disabled={this.state.type === CHOROPLETH_LOG}>Choropleth, equal in log space</button>
        </div>
      </Control>
    </LeafletMap>
  }

  renderGrid () {
    switch (this.state.type) {
      case DOT:
        return <ReactDot
          grid={this.state.grid}
          color='rgb(0, 0, 200)' />
      case CHOROPLETH_QUANTILE:
        return <ReactChoropleth
          grid={this.state.grid}
          breaks={scales.quantile({})}
          colors={[
            'rgba(241, 237, 246, 0.42)',
            'rgba(188, 200, 224, 0.42)',
            'rgba(116, 169, 207, 0.42)',
            'rgba(43, 140, 190, 0.42)',
            'rgba(4, 90, 142, 0.42)'
          ]}
          labels={16} />
      case CHOROPLETH_EQUAL:
        return <ReactChoropleth
          grid={this.state.grid}
          breaks={scales.equal({})}
          colors={[
            'rgba(241, 237, 246, 0.42)',
            'rgba(188, 200, 224, 0.42)',
            'rgba(116, 169, 207, 0.42)',
            'rgba(43, 140, 190, 0.42)',
            'rgba(4, 90, 142, 0.42)'
          ]}
          labels={16} />
      case CHOROPLETH_LOG:
        return <ReactChoropleth
          grid={this.state.grid}
          breaks={scales.equal({ scale: scaleLog().domain([1, this.state.grid.max]).clamp(true) })}
          colors={[
            'rgba(241, 237, 246, 0.42)',
            'rgba(188, 200, 224, 0.42)',
            'rgba(116, 169, 207, 0.42)',
            'rgba(43, 140, 190, 0.42)',
            'rgba(4, 90, 142, 0.42)'
          ]}
        />
    }
  }
}

render(<GridualizerExample />, document.getElementById('root'))
