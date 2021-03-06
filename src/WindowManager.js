// @flow

import React, { Component } from 'react';

// ======================================================

import TreeLayoutManager from './TreeLayout.js'
import { treeToData } from './TreeLayout.js'
import type { Tree as LayoutTree } from './TreeLayout.js'

type TreeLayoutWindowManagerState = {
  tree: LayoutTree,
  activeNodeId: string,
}

function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random()*16|0;
    let v1 = r&0x3;
    let v2 = 0x8;
    let v = c === 'x' ? r : (v1|v2);
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
  } else if (node.kind === 'horizontal' || node.kind === 'vertical' || node.kind === 'tab'){
    let child_sizes = node.children.map((c) => getNodeSize(c, windowData, wmWidth, wmHeight));
    let child_boxes = child_sizes.map(([x, y, w, h]) => [ x, y, x+w, y+h ]);
    let [ x, y, w, h ] = child_boxes.reduce(([l1, t1, r1, b1], [l2, t2, r2, b2]) => [ Math.min(l1, l2), Math.min(t1, t2), Math.max(r1, r2), Math.max(b1, b2) ]);
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
              activeGroupId: null,
              tree: { kind: 'root',
                      lastActiveTime: -1,
                      id: '_root',
                      child: null, }
            }
  componentDidUpdate(prevProps, prevState){
    if (this.state.activeNodeId !== prevState.activeNodeId){

      let [ node, _ ] = getNodeById(this.state.tree, null, this.state.activeNodeId);
      if (node.kind === 'window'){
        node.child.props['data-onRequestFocus']();
      }
    }
  }
  simplify(parent, node){
    if (node.kind === 'root'){
      if (node.child != null){
        this.simplify(node, node.child);
      }
    } else if (node.kind === 'horizontal' || node.kind === 'vertical' || node.kind === 'tab'){
      if (node.children.length === 1){
        if (parent.kind === 'root'){
          parent.child = node.children[0];
        } else if (node.kind === 'horizontal' || node.kind === 'vertical' || node.kind === 'tab'){
          let idx = parent.children.indexOf(node);
          parent.children[idx] = node.children[0];
        } else {
          throw new Error('nyi ' + node.kind);
        }
      } else {
        node.children.forEach((c) => this.simplify(node, c));
      }
    } else if (node.kind === 'window'){
      return;
    } else {
      throw new Error('nyi ' + node.kind);
    }
  }
  focusParentGroup(){
    let currentGroupId = this.state.activeGroupId;
    if (currentGroupId == null){
      currentGroupId = this.state.activeNodeId
    }
    let [ _, parent ] = getNodeById(this.state.tree, null, currentGroupId);
    if (parent !== null && parent.kind !== '_root'){
      this.setState({ activeGroupId: parent.id });
    }
  }
  focusWindow(key) {
    let [ node, _ ] = getNodeById(this.state.tree, null, key);
    node.lastActiveTime = this.state.lastActiveTime+1;
    this.simplify(null, this.state.tree);
    this.setState({ activeNodeId: key, activeGroupId: null, tree: this.state.tree, lastActiveTime: this.state.lastActiveTime+1 });
  }
  makeNewWindow(win) {
    let [ node, parent ] = getNodeById(this.state.tree, null, this.state.activeNodeId);

    let container = null

    if (node.kind === 'window'){
      if (parent.kind === 'root'){
        container = {
          kind: 'horizontal',
          sizes: [ 1 ],
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
      container.sizes = container.sizes.map((s) => { return s*(container.children.length-1)/(container.children.length) });
      container.sizes.push(1./container.children.length);
    }

    this.setState({ tree: this.state.tree, lastActiveTime: this.state.lastActiveTime+1, activeNodeId: activeNodeId, activeGroupId: null });
  }
  closeKey(key) {
    if (key === this.state.activeNodeId){
      this.closeActive();
    } else {
      this._closeId(key);
      if (key === '_root'){
        this.setState({ tree: this.state.tree, activeNodeId: '_root', activeGroupId: null, });
      } else {
        this.setState({ tree: this.state.tree });
      }
    }
  }
  closeActive() {
    let nodeId = this.state.activeGroupId;
    if (nodeId == null){
      nodeId = this.state.activeNodeId;
    }
    let parentId = this._closeId(nodeId);

    let [ node, _ ] = getNodeById(this.state.tree, null, parentId);
    let activeId;
    if (node.kind === 'vertical' || node.kind === 'horizontal' || node.kind === 'tab') {
      activeId = node.children[0].id;
    } else if (node.kind === 'root') {
      activeId = node.id
    } else {
      console.log(node);
      throw new Error('nyi');
    }

    this.simplify(null, this.state.tree);

    this.setState({ tree: this.state.tree, activeNodeId: activeId, activeGroupId: null});
  }
  _closeId(id) {
    let [ node, parent ] = getNodeById(this.state.tree, null, id);
    closeChildren(node)
    let parentId;
    if (node.kind === 'root'){
      parentId = node.id;
      if (node.child != null){
        this._closeId(node.child.id);
      }
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
      let rm_size = parent.sizes[idx]
      parent.sizes.splice(idx, 1);
      parent.sizes = parent.sizes.map((s) => s + rm_size/(parent.children.length));
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
        sizes: [ 1 ],
        id: genUUID(),
        children: [ node ],
      }
      parent.children[idx] = newNode;
      this.setState({ tree: this.state.tree, activeGroupId: newNode.id });
    }
    else if (parent.kind === 'root') {
      const newNode = {
        kind: kind,
        lastActiveTime: -1,
        sizes: [ 1 ],
        id: genUUID(),
        children: [ node ],
      }
      parent.child = newNode;
      this.setState({ tree: this.state.tree, activeGroupId: newNode.id });

    }
  }
  toggleCurrentOrientation() {
    let node, parent;
    if (this.state.activeGroupId != null){
      let agid = this.state.activeGroupId;
      if (agid === '_root'){
        agid = this.state.tree.child.id;
      }      
      [ node, parent ] = getNodeById(this.state.tree, null, agid);
    } else {
      [ node, parent ] = getNodeById(this.state.tree, null, this.state.activeNodeId);
    }

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
    let [ node, _ ] = getNodeById(this.state.tree, null, key);
    let child = node.children[idx]
    let childId = child.id;
    child.lastActiveTime = this.state.lastActiveTime + 1;
    this.setState({ activeNodeId: childId, activeGroupId: null, tree: this.state.tree, lastActiveTime: this.state.lastActiveTime + 1 });
  }
  swapToPixels(node_id, x, y){
    let [ windowData, _ ] = treeToData(this.props.config, this.state.tree, '_root', null, 0);
    let wmHeight = this._dom_node.clientHeight;
    let wmWidth = this._dom_node.clientWidth;

    let contains = Object.keys(windowData).map((k) => {
      let [ node, _ ] = getNodeById(this.state.tree, null, k);
      let [ ax, ay, aw, ah ] = getNodeSize(node, windowData, wmWidth, wmHeight);
      return [ x >= ax && 
               x <= ax + aw && 
               y >= ay && 
               y <= ay + ah, k ];
    });
    let target_id = contains.filter(([ c, id ]) => c)[0][1];
    this.swapNodes(node_id, target_id);
  }
  changeSizeByPixels(node_id, dx, dy, x, y){
    let [ node, parent ] = getNodeById(this.state.tree, null, node_id);

    if ((parent.kind === 'horizontal' || parent.kind === 'vertical') && parent.sizes.length > 1){

      let [ windowData, _ ] = treeToData(this.props.config, this.state.tree, node_id, null, 0);
      let wmHeight = this._dom_node.clientHeight;
      let wmWidth = this._dom_node.clientWidth;

      let [ _0, _1, paw, pah ] = getNodeSize(parent, windowData, wmWidth, wmHeight);

      let idx = parent.children.indexOf(node);
      let change_side;
      if (idx === 0){
        change_side = 1;
      } else if (idx === parent.children.length-1){
        change_side = -1;
      } else {
        let [ ax, ay, aw, ah ] = getNodeSize(node, windowData, wmWidth, wmHeight);

        let dist_neg;
        let dist_pos;
        if (parent.kind === 'horizontal'){
          dist_neg = x - ax;
          dist_pos = ax + aw - x;
        } else if (parent.kind === 'vertical'){
          dist_neg = y - ay;
          dist_pos = ay + ah - y;
        }
        change_side = dist_neg < dist_pos ? -1 : 1;
      }
      let delta;
      if (parent.kind === 'horizontal'){
        delta = dx / paw*change_side;
      } else if (parent.kind === 'vertical'){
        delta = dy / pah*change_side;
      }
      let min_size = .01;
      if (parent.sizes[idx] + delta < min_size){
        delta = min_size - parent.sizes[idx];
      }
      if (parent.sizes[idx + change_side] - delta < min_size){
        delta = parent.sizes[idx + change_side] - min_size;
      }
      parent.sizes[idx] += delta;
      parent.sizes[idx + change_side] -= delta;
      this.setState({ tree: this.state.tree });
    }
  }
  changeActiveSize(delta) {
    let [ node, parent ] = getNodeById(this.state.tree, null, this.state.activeNodeId);
    if ((parent.kind === 'horizontal' || parent.kind === 'vertical') && parent.sizes.length > 1){
      let idx = parent.children.indexOf(node);
      let min_size = .01;
      if (parent.sizes[idx] + delta < min_size){
        delta = min_size - parent.sizes[idx];
      } else if (1 - (parent.sizes[idx] + delta) < min_size*(parent.sizes.length-1)){
        delta = 1 - parent.sizes[idx] - min_size*(parent.sizes.length-1)
      }
      parent.sizes[idx] += delta;
      let size_idxs = parent.sizes.map((s, i) => [ s, i ])
                                  .filter((s,i) => i !== idx);
      size_idxs = size_idxs.sort();
      let deltas = Array(size_idxs.length).fill(delta / (parent.sizes.length-1));
      size_idxs.forEach(([s, i], j) => {
        parent.sizes[i] -= deltas[j];
        if (parent.sizes[i] < min_size){
          let extra = min_size - parent.sizes[i];
          for (let k = j+1; k < deltas.length; k++){
            deltas[k] += extra / (deltas.length-(j+1));
          }
          parent.sizes[i] = min_size;
        }
      });
      this.setState({ tree: this.state.tree });
    }
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
    let nodeId = this.state.activeGroupId;
    if (nodeId == null){
      nodeId = this.state.activeNodeId;
    }
    let [ node, parent ] = getNodeById(this.state.tree, null, nodeId);

    let dirHor = dir === 'right' || dir === 'left';

    function rmChild(parent, child){
      let idx = parent.children.indexOf(node);
      parent.children.splice(idx, 1);
      let rm_size = parent.sizes[idx];
      parent.sizes.splice(idx, 1);
      parent.sizes = parent.sizes.map((s) => s + rm_size/(parent.children.length));
    }

    function addChild(parent, node_idx, node){
      parent.children.splice(node_idx, 0, node);
      parent.sizes = parent.sizes.map((s) => { return s*(parent.children.length-1)/(parent.children.length) });
      parent.sizes.splice(node_idx, 0, 1./parent.children.length);
    }

    if (parent.children != null){
      let parentHor = parent.kind === 'horizontal' || parent.kind === 'tab';

      let idx = parent.children.indexOf(node);
      let len = parent.children.length;

      let neighbor;


      if (dirHor && parentHor){
        if (dir === 'left' && idx > 0){
          neighbor = parent.children[idx-1];
        } else if (dir === 'right' && idx < len-1){
          neighbor = parent.children[idx+1];
        }
      } else if (!dirHor && !parentHor){
        if (dir === 'up' && idx > 0){
          neighbor = parent.children[idx-1];
        } else if (dir === 'down' && idx < len-1){
          neighbor = parent.children[idx+1];
        }
      }

      if (neighbor != null){
        if (neighbor.kind === 'window'){

          if (parent.children.length === 2){
            this.swapNodes(node.id, neighbor.id);
            return
          } else if (parent.children.length === 1){
            return;
          }

          let idx = parent.children.indexOf(node);
          rmChild(parent, node);

          idx = parent.children.indexOf(neighbor);

          let kind = !dirHor ? 'horizontal' : 'vertical';

          const newNode = {
            kind: kind,
            lastActiveTime: -1,
            sizes: [ .5, .5 ],
            id: genUUID(),
            children: [ node, neighbor ],
          }

          parent.children[idx] = newNode;

          this.simplify(null, this.state.tree);

          this.setState({ tree: this.state.tree });

          return;
        } else {
          let add_directly_to_neighbor = neighbor.kind === parent.kind || true;
          if (add_directly_to_neighbor){
            let idx = parent.children.indexOf(node);
            rmChild(parent, node);

            let end = dir === 'left' || dir === 'up';
            if (neighbor.kind !== parent.kind){
              end = false;
            }

            idx = end ? neighbor.children.length : 0;
            addChild(neighbor, idx, node);

            this.simplify(null, this.state.tree);

            this.setState({ tree: this.state.tree });
            return;
          } else {
            throw new Error('should not be reached');
          }
        }
      }
    }

    let [ _, grandparent ] = getNodeById(this.state.tree, null, parent.id);

    if (parent.kind === 'root'){
      return;
    }

    if (grandparent.kind === 'root'){

      let kind = dirHor ? 'horizontal' : 'vertical';

      let end = dir === 'right' || dir === 'down';

      let children = end ? [ grandparent.child, node ] : [ node, grandparent.child ]

      const newNode = {
        kind: kind,
        lastActiveTime: -1,
        sizes: [ .5, .5 ],
        id: genUUID(),
        children: children,
      }

      rmChild(parent, node);

      grandparent.child = newNode;

      this.simplify(null, this.state.tree);
      this.setState({ tree: this.state.tree });

    } else {
      let neighbor = grandparent;

      rmChild(parent, node);

      let end = dir === 'right' || dir === 'down';

      let parent_idx = grandparent.children.indexOf(parent);

      let node_idx = end ? parent_idx+1 : parent_idx;

      addChild(neighbor, node_idx, node);

      this.simplify(null, this.state.tree);

      this.setState({ tree: this.state.tree });
      return;
    }
  }
  swapNodes(id1, id2){
    if (id1 === id2){
      return
    }
    let [ node1, parent1 ] = getNodeById(this.state.tree, null, id1);
    let [ node2, parent2 ] = getNodeById(this.state.tree, null, id2);
    if (    (parent1.kind === 'vertical' || parent1.kind === 'horizontal' || parent1.kind === 'tab')
         && (parent2.kind === 'vertical' || parent2.kind === 'horizontal' || parent2.kind === 'tab')){

      let idx1 = parent1.children.indexOf(node1);
      let idx2 = parent2.children.indexOf(node2);
      parent1.children[idx1] = node2;
      parent2.children[idx2] = node1;

      node1.lastActiveTime = this.state.lastActiveTime + 2;
      node2.lastActiveTime = this.state.lastActiveTime + 1;
    } else {
      throw new Error('nyi ' + parent1.kind + ' ' + parent2.kind);
    }
    this.setState({ tree: this.state.tree, lastActiveTime: this.state.lastActiveTime + 2 });
  }
  moveActiveFocusTabIndex(idx){
    let nodeId = this.state.activeGroupId;
    if (nodeId == null || nodeId === '_root'){
      nodeId = this.state.activeNodeId;
    }

    this.moveActiveFocusTabIndexParent(nodeId, idx);

  }
  moveActiveFocusTabIndexParent(nodeId, idx){
    let [ node, parent ] = getNodeById(this.state.tree, null, nodeId);

    if (node.kind === 'tab'){
      idx = Math.min(idx, node.children.length-1);
      this.focusWindow(node.children[idx].id);
    } else if (node.kind !== 'root'){
      this.moveActiveFocusTabIndexParent(parent.id, idx);
    }
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
    let nodeId = this.state.activeGroupId;
    if (nodeId == null || nodeId === '_root' || nodeId === this.state.tree.child.id){
      nodeId = this.state.activeNodeId;
    }

    let nextId = this.getInDirection(nodeId, dir);
    if (nextId != null){
      nextId = this.descendToWindowFromDir(nextId, dir);
      this.focusWindow(nextId);
    }
  }
  getInDirection(nodeId, dir){
    let [ node, parent ] = getNodeById(this.state.tree, null, nodeId);
    if (parent.kind === 'tab'){
      return this.getInDirection(parent.id, dir);
    } else if (parent.kind === 'horizontal'){

      let idx = parent.children.indexOf(node);

      if (dir === 'right'){
        if (idx+1 < parent.children.length){
          return parent.children[idx+1].id;
        } else {
          return this.getInDirection(parent.id, dir);
        }
      } else if (dir === 'left'){
        if (idx-1 >= 0){
          return parent.children[idx-1].id;
        } else {
          return this.getInDirection(parent.id, dir);
        }
      } else {
        return this.getInDirection(parent.id, dir);
      }
    } else if (parent.kind === 'vertical'){

      let idx = parent.children.indexOf(node);

      if (dir === 'down'){
        if (idx+1 < parent.children.length){
          return parent.children[idx+1].id;
        } else {
          return this.getInDirection(parent.id, dir);
        }
      } else if (dir === 'up'){
        if (idx-1 >= 0){
          return parent.children[idx-1].id;
        } else {
          return this.getInDirection(parent.id, dir);
        }
      } else {
        return this.getInDirection(parent.id, dir);
      }

    } else {
      return null;
    }
  }
  descendToWindowFromDir(nodeId, dir){
    let [ node, _ ] = getNodeById(this.state.tree, null, nodeId);

    if (node.kind === 'window'){
      return node.id;
    } else if (node.kind === 'tab'){
      let lastActives = node.children.map((c) => c.lastActiveTime);
      let idx = lastActives.indexOf(Math.max.apply(Math, lastActives));
      return this.descendToWindowFromDir(node.children[idx].id, dir);
    } else if (node.kind === 'horizontal'){
      if (dir === 'right'){
        return this.descendToWindowFromDir(node.children[0].id, dir);
      } else if (dir === 'left'){
        return this.descendToWindowFromDir(node.children[node.children.length-1].id, dir);
      } else {
        let lastActives = node.children.map((c) => c.lastActiveTime);
        let idx = lastActives.indexOf(Math.max.apply(Math, lastActives));
        return this.descendToWindowFromDir(node.children[idx].id, dir);
      }
    } else if (node.kind === 'vertical'){
      if (dir === 'down'){
        return this.descendToWindowFromDir(node.children[0].id, dir);
      } else if (dir === 'up'){
        return this.descendToWindowFromDir(node.children[node.children.length-1].id, dir);
      } else {
        let lastActives = node.children.map((c) => c.lastActiveTime);
        let idx = lastActives.indexOf(Math.max.apply(Math, lastActives));
        return this.descendToWindowFromDir(node.children[idx].id, dir);
      }
    }
    return nodeId;
  }
  render() {
    return (
      <TreeLayoutManager elemRef={ (r) => { if (r != null){ this._dom_node = r; } } } tree={this.state.tree} activeNodeId={this.state.activeNodeId} activeGroupId={this.state.activeGroupId} onSwitchTab={this.switchTabs.bind(this)} config={this.props.config}>
        { this.state.windows }
      </TreeLayoutManager>
    );
  }
}
