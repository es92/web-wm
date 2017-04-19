// @flow

declare var VimJS: any;

import React, { Component } from 'react';
import './App.css';

import { TreeLayoutWindowManager } from './WindowManager.js'

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

   let mousedown = false;
   let last_mouse_x = -1;
   let last_mouse_y = -1;
   let active_node_id = null;

    window.addEventListener('mousedown', (e) => { 
      last_mouse_x = e.clientX;
      last_mouse_y = e.clientY;
      active_node_id = this.wm.state.activeNodeId;
      mousedown = true;
    });
    window.addEventListener('mouseup', (e) => { mousedown = false; });
    window.addEventListener('dragend', (e) => { mousedown = false; });
    window.addEventListener('mouseleave', (e) => { mousedown = false; });

    window.oncontextmenu = (e) => { 
      if (e.altKey)
        return false;
    };

    window.addEventListener('mousemove', (e) => {
      if (mousedown && e.altKey){
        let dx = e.clientX - last_mouse_x;
        let dy = e.clientY - last_mouse_y;

        this.wm.changeSizeByPixels(active_node_id, dx, dy, e.clientX, e.clientY);

        last_mouse_x = e.clientX;
        last_mouse_y = e.clientY;
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!e.altKey){ return }
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey){
        if (e.key === 'n'){
          this.wm.changeActiveSize(-.1);
        } else if (e.key === 'i'){
          this.wm.changeActiveSize(.1);
        }     

      } else if (e.key === 'Enter'){
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

      } else if (e.key === 'q'){
        this.wm.focusParentGroup();
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
      this.wm.moveActiveLeft()
      this.wm.moveActiveFocusRight()
      this.wm.moveActiveFocusRight()
      this.wm.moveActiveRight()
      //this.wm.makeNewWindow(this.makeTestWindow());
      //this.wm.changeSizeByPixels(this.wm.state.activeNodeId, 10, 10, 10, 10);
      //this.wm.closeKey('_root');
      //setTimeout(() => {
      //  this.wm.makeNewWindow(this.makeTestWindow());
      //  //this.wm.moveActiveRight()
      //}, 2000);
    }, 500);
  }
  render() {

    let config = {
      activeColor: '#55b',
      inactiveColor: '#112',
      groupHighlightColor: '#55b',
      windowBarHeight: '4px',
      tabHeightPx: 10,
    }

    return (<TreeLayoutWindowManager ref={ (r) => this.wm = r } maybeGetWindow={this.maybeGetWindow} config={config}/>);
  }
}

export default App;
