// @flow

declare var VimJS: any;

import React, { Component } from 'react';
import './App.css';

import { PercentLayoutWindowManager, TreeLayoutWindowManager } from './WindowManager.js'

//import Vim from 'react-es-vim.js/ReactVim.js';

class App extends Component {
  makeTestWindow(){
    let key = '' + Math.random();
    let color = 'rgb(' + Math.floor(Math.random()*255) + ',' + Math.floor(Math.random()*255) + ',' + Math.floor(Math.random()*255) + ')';

    let onFocus = (key, e) => {
      this.wm.focusWindow(key);
    };

    let onMouseOver = (key, e) => {
      e.target.focus()
    };

    let onRequestFocus = () => {

    }

    let newWindow = <div tabIndex="0" 
                         key={key} 
                         data-onRequestFocus={onRequestFocus}
                         onMouseOver={onMouseOver.bind(this, key)} 
                         onFocus={onFocus.bind(this, key)} 
                         style={{backgroundColor: color, width: '100%', height: '100%'}}>
                      {key}
                    </div>
    return newWindow
  }
  componentDidMount() {
    window.addEventListener('keydown', (e) => {
      if (!e.altKey){ return }
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Enter'){
        this.wm.makeNewWindow(this.makeTestWindow())

      } else if (e.key === 'f'){
        this.wm.toggleCurrentOrientation();
      } else if (e.key === 'w'){
        this.wm.switchToTabs()
        
      } else if (e.key === 'b'){
        this.wm.makeVerticalSplit()
      } else if (e.key === 'h'){
        this.wm.makeHorizontalSplit()

      } else if (e.key === 'c'){
        this.wm.closeActive()

      } else if (e.key === 'a'){
        // move active to parent
      } else if (e.key === 'n'){
        this.wm.moveActiveFocusLeft()
      } else if (e.key === 'i'){
        this.wm.moveActiveFocusRight()
      } else if (e.key === 'u'){
        this.wm.moveActiveFocusUp()
      } else if (e.key === 'e'){
        this.wm.moveActiveFocusDown()

      } else if (e.key === 'N'){
        this.wm.moveActiveLeft()
      } else if (e.key === 'I'){
        this.wm.moveActiveRight()
      } else if (e.key === 'U'){
        this.wm.moveActiveUp()
      } else if (e.key === 'E'){
        this.wm.moveActiveDown()
      }

      return false;
    });

    setTimeout(() => {
      this.wm.makeNewWindow(this.makeTestWindow());
      this.wm.makeNewWindow(this.makeTestWindow());
      this.wm.makeNewWindow(this.makeTestWindow());
      this.wm.makeNewWindow(this.makeTestWindow());
      this.wm.makeHorizontalSplit()
      this.wm.makeNewWindow(this.makeTestWindow());
      this.wm.moveActiveFocusRight()
      this.wm.moveActiveFocusRight()
      this.wm.switchToTabs()
      this.wm.moveActiveFocusLeft()
      setTimeout(() => {
        this.wm.moveActiveRight()
      }, 500);
    }, 500);
  }
  render() {
    return (<TreeLayoutWindowManager ref={ (r) => this.wm = r } maybeGetWindow={this.maybeGetWindow}/>);
  }
}

export default App;
