// @flow

import React, { Component } from 'react';

// ======================================================

import TreeLayoutManager from './TreeLayout.js'
import { treeToData as treeToData } from './TreeLayout.js'
import type { Tree as LayoutTree } from './TreeLayout.js'

type TreeLayoutWindowManagerState = {
  tree: LayoutTree,
  activeNodeId: string,
}

function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

function getNodeById(node, parent, id){
  if (node.id === id){
    return [ node, parent ];
  } else if (node.kind === 'vertical' || node.kind === 'horizontal' || node.kind === 'tab') {
    return node.children.map((child) => getNodeById(child, node, id))
                        .filter((n) => n != null)[0]
  } else if (node.kind === 'root') {
    return getNodeById(node.child, node, id);
  }
  return null;
}

function closeChildren(node){
  if (node.kind === 'window'){
    if ('wm_close' in node.child)
      node.child.wm_close()
  } else if (node.kind === 'horizontal' || node.kind === 'vertical' || node.kind === 'tab') {
    node.children.forEach(function(c){ closeChildren(c); });
  } else if (node.kind === 'root'){
    if (node.child !== null){
      closeChildren(node.child);
    }
  } else {
    console.log(node);
    throw new Error('nyi');
  }
}

function getNodeSize(node, windowData, wmWidth, wmHeight){
  if (node.kind === 'window'){
    let d = windowData[node.id];

    let x = wmWidth*d.position.x + d.pposition.x;
    let w = wmWidth*d.position.w + d.pposition.w;
                                          
    let y = wmHeight*d.position.y + d.pposition.y;
    let h = wmHeight*d.position.h + d.pposition.h;

    return [ x, y, w, h ];
  } else {
    console.log(node);
    throw new Error('nyi');
  }
}

export class TreeLayoutWindowManager extends Component {
  props: WindowManagerProps
  state: TreeLayoutWindowManagerState = {
              lastActiveTime: 0,  
              activeNodeId: '_root',
              tree: { kind: 'root',
                      lastActiveTime: -1,
                      id: '_root',
                      child: null, }
            }
  componentDidUpdate(prevProps, prevState){
    if (this.state.activeNodeId !== prevState.activeNodeId){

      let [ node, parent ] = getNodeById(this.state.tree, null, this.state.activeNodeId);
      if (node.kind === 'window'){
        node.child.props['data-onRequestFocus']();
      }
    }
  }
  focusWindow(key) {
    let [ node, parent ] = getNodeById(this.state.tree, null, key);
    node.lastActiveTime = this.state.lastActiveTime+1;
    this.setState({ activeNodeId: key, tree: this.state.tree, lastActiveTime: this.state.lastActiveTime+1 });
  }
  makeNewWindow(win) {
    let [ node, parent ] = getNodeById(this.state.tree, null, this.state.activeNodeId);

    let container = null

    if (node.kind === 'window'){
      if (parent.kind === 'root'){
        container = {
          kind: 'horizontal',
          lastActiveTime: -1,
          id: genUUID(),
          children: [ node ]
        }
        parent.child = container;
      } else {
        container = parent;
      }
    } else {
      container = node;
    }

    let newNode = {
      kind: 'window',
      id: win.key,
      lastActiveTime: -1,
      child: win
    }

    let activeNodeId;
    if (container.kind === 'root'){
      newNode.lastActiveTime = this.state.lastActiveTime+1;
      activeNodeId = win.key
      this.setState({  });
      container.child = newNode;
    }
    else {
      activeNodeId = this.state.activeNodeId;
      container.children.push(newNode);
    }

    this.setState({ tree: this.state.tree, lastActiveTime: this.state.lastActiveTime+1, activeNodeId: activeNodeId });
  }
  closeKey(key) {
    if (key == this.state.activeNodeId){
      this.closeActive();
    } else {
      this._closeId(key);
      this.setState({ tree: this.state.tree });
    }
  }
  closeActive() {
    let parentId = this._closeId(this.state.activeNodeId);

    let [ node, parent ] = getNodeById(this.state.tree, null, parentId);
    let activeId;
    if (node.kind === 'vertical' || node.kind === 'horizontal' || node.kind === 'tab') {
      activeId = node.children[0].id;
    } else if (node.kind === 'root') {
      activeId = node.id
    } else {
      console.log(node);
      throw new Error('nyi');
    }

    this.setState({ tree: this.state.tree, activeNodeId: activeId});
  }
  _closeId(id) {
    let [ node, parent ] = getNodeById(this.state.tree, null, id);
    closeChildren(node)
    let parentId;
    if (node.kind === 'root'){
      parentId = node.id;
    } else if (parent.kind === 'root'){
      parent.child = null;
      parentId = parent.id;
    } else {
      let idx = parent.children.indexOf(node);
      parent.children.splice(idx, 1)
      parentId = parent.id;
      if (parent.children.length === 0){
        parentId = this._closeId(parentId);
      }
    }
    return parentId;
  }
  makeVerticalSplit() {
    this._makeNewSplit('vertical');
  }
  makeHorizontalSplit() {
    this._makeNewSplit('horizontal');
  }
  _makeNewSplit(kind) {
    let [ node, parent ] = getNodeById(this.state.tree, null, this.state.activeNodeId);

    if (node.kind === 'root') {
      return;
    }

    if (parent.kind === 'horizontal' || parent.kind === 'vertical' || parent.kind === 'tab') {
      let idx = parent.children.indexOf(node);
      const newNode = {
        kind: kind,
        lastActiveTime: -1,
        id: genUUID(),
        children: [ node ],
      }
      parent.children[idx] = newNode;
      this.setState({ tree: this.state.tree });
    }
    else if (parent.kind === 'root') {
      throw Error('nyi');
    }
  }
  toggleCurrentOrientation() {
    let [ node, parent ] = getNodeById(this.state.tree, null, this.state.activeNodeId);

    if (node.kind === 'root')
      return;

    let current = null

    if (node.kind === 'horizontal' || node.kind === 'vertical' || node.kind === 'tab'){
      current = node;
    }
    if (current == null && (parent.kind === 'horizontal' || parent.kind === 'vertical' || parent.kind === 'tab')){
      current = parent;
    }

    if (current !== null){
      if (current.kind === 'horizontal') {
        current.kind = 'vertical';
      } else if (current.kind === 'vertical') {
        current.kind = 'horizontal';
      } else if (current.kind === 'tab') {
        current.kind = 'horizontal';
      }

      this.setState({ tree: this.state.tree });
    }
  }
  switchToTabs() {
    let [ node, parent ] = getNodeById(this.state.tree, null, this.state.activeNodeId);

    if (node.kind === 'root')
      return;

    let current = null

    if (node.kind === 'horizontal' || node.kind === 'vertical' || node.kind === 'tab'){
      current = node;
    }
    if (current == null && (parent.kind === 'horizontal' || parent.kind === 'vertical' || parent.kind === 'tab')){
      current = parent;
    }

    if (current !== null){
      current.kind = 'tab';
    }
    this.setState({ tree: this.state.tree });
  }
  switchTabs(key, idx) {
    let [ node, parent ] = getNodeById(this.state.tree, null, key);
    let child = node.children[idx]
    let childId = child.id;
    child.lastActiveTime = this.state.lastActiveTime + 1;
    this.setState({ activeNodeId: childId, tree: this.state.tree, lastActiveTime: this.state.lastActiveTime + 1 });
  }
  moveActiveRight(){
    this.moveActiveInDirection('right');
  }
  moveActiveLeft(){
    this.moveActiveInDirection('left');
  }
  moveActiveDown(){
    this.moveActiveInDirection('down');
  }
  moveActiveUp(){
    this.moveActiveInDirection('up');
  }
  moveActiveInDirection(dir){ 
    console.log('huh?');
  }

  moveActiveFocusRight(){
    this.moveActiveFocusInDirection('right');
  }
  moveActiveFocusLeft(){
    this.moveActiveFocusInDirection('left');
  }
  moveActiveFocusDown(){
    this.moveActiveFocusInDirection('down');
  }
  moveActiveFocusUp(){
    this.moveActiveFocusInDirection('up');
  }
  moveActiveFocusInDirection(dir){ 
    let nextId = this.getInDirection(dir);
    if (nextId != null){
      this.focusWindow(nextId);
    }
  }
  getInDirection(dir){
    let [ windowData, children ] = treeToData(this.state.tree, this.state.activeNodeId, null);
    let wmHeight = this._dom_node.clientHeight;
    let wmWidth = this._dom_node.clientWidth;

    let [ node, parent ] = getNodeById(this.state.tree, null, this.state.activeNodeId);

    let [ ax, ay, aw, ah ] = getNodeSize(node, windowData, wmWidth, wmHeight);
    let acx = ax + aw/2;
    let acy = ay + ah/2;

    let dist_key = children.filter((child) => !windowData[child.key].hidden)
                       .map((child) => {
             let [ x, y, w, h ] = getNodeSize({ kind: 'window', id: child.key }, windowData, wmWidth, wmHeight);
             let cx = x + w/2;
             let cy = y + h/2;
             let dist = Math.sqrt((acx - cx)*(acx - cx) + (acy - cy)*(acy - cy));
             let angle = Math.atan2(-(cy - acy), cx - acx)*180/Math.PI;
             if (angle < 0)
               angle += 360;
             return [ dist, angle, child.key ]
            });
    dist_key = dist_key.filter(([dist, angle, key], ) => {
      if (key === this.state.activeNodeId){
        return false;
      } else if (dir === 'right') {
        return angle > 270 || angle < 90;
      } else if (dir === 'left'){
        return angle < 270 && angle > 90;
      } else if (dir === 'up'){
        return angle < 180;
      } else if (dir === 'down'){
        return angle > 180;
      }
    });
    if (dist_key.length > 0){
      let nextId = dist_key.sort()[0][2]
      if (windowData[nextId].internal && windowData[nextId].tabChildren.length > 0){
        return windowData[nextId].tabChildren[0];
      }
      return nextId;
    } else {
      return null;
    }
  }
  render() {
    return (
      <TreeLayoutManager elemRef={ (r) => { if (r != null){ this._dom_node = r; } } } tree={this.state.tree} activeNodeId={this.state.activeNodeId} onSwitchTab={this.switchTabs.bind(this)}>
        { this.state.windows }
      </TreeLayoutManager>
    );
  }
}
