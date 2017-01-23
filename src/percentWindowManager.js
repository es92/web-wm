// @flow

import React, { Component } from 'react';

// ======================================================

import PercentLayoutManager from './PercentLayout.js'

type WindowManagerProps = {
  maybeGetWindow: () => WindowPromise

}

type PercentLayoutWindowManagerState = {
  windows: Array<React$Element>,
  orientation: any,
}

export class PercentLayoutWindowManager extends Component {
  props: WindowManagerProps
  state: PercentLayoutWindowManagerState
  state: { windows: [ <div key='1' style={{backgroundColor: 'blue'}}>a</div>,
                      <div key='2' style={{backgroundColor: 'red'}}>b</div> ],
                      orientation: 'vertical'}
  componentDidMount() {
    window.addEventListener('keydown', (e) => {

      if (e.key === 'e'){
        if (this.state.orientation === 'vertical'){
          this.setState({ orientation: 'horizontal' })
        }
        else {
          this.setState({ orientation: 'vertical' })
        }
      }
      else {
        this.props.maybeGetWindow().then((win) => {
          this.setState({ windows: [ ...this.state.windows, win ] });
        });
      }
    });
  }
  render() {
    return (
      <PercentLayoutManager orientation={this.state.orientation}>
        { this.state.windows }
      </PercentLayoutManager>
    );
  }
}

// ======================================================

