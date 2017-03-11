// @flow

import React from 'react';

import WindowCompositor from './WindowCompositor.js'

type Node = {
              kind: 'root',
              id: string,
              lastActiveTime: long,
              children: Array<Node> | null
            } | {
              kind: 'vertical',
              id: string,
              lastActiveTime: long,
              children: Array<Node>
            } | {
              kind: 'horizontal',
              id: string,
              lastActiveTime: long,
              children: Array<Node>
            } | {
              kind: 'tab',
              id: string,
              lastActiveTime: long,
              children: Array<Node>
            } | {
              kind: 'window',
              id: string,
              lastActiveTime: long,
              children: Array<React$Element>
            }

type TreeLayoutProps = {
  elemRef: idk,
  activeNodeId: string,
  tree: RootNode
}

function iterKeys(obj) {
  let keys = []
  for (let key in obj){
    if (obj.hasOwnProperty(key)){
      keys.push(key)
    }
  }
  return keys;
}

function verticalShrinkWindowPositions(windowData, i, n, depth) {
  var shrunkWindowData = {}
  iterKeys(windowData).forEach(key => {
    shrunkWindowData[key] = { ...windowData[key] };
    shrunkWindowData[key].position = {
      x: windowData[key].position.x,
      y: i/n + windowData[key].position.y/n,
      w: windowData[key].position.w,
      h: windowData[key].position.h/n,
    };
  });
  return shrunkWindowData;
}

function horizontalShrinkWindowPositions(windowData, i, n, depth) {
  var shrunkWindowData = {}
  iterKeys(windowData).forEach(key => {
    shrunkWindowData[key] = { ...windowData[key] };
    shrunkWindowData[key].position = {
      x: i/n + windowData[key].position.x/n,
      y: windowData[key].position.y,
      w: windowData[key].position.w/n,
      h: windowData[key].position.h,
    };
  });
  return shrunkWindowData;
}

function shrinkWindowPositions(node, shrinker, activeNodeId, onSwitchTab, depth) {
  let childData = node.children.map(child => treeToData(child, activeNodeId, onSwitchTab, depth+1));
  let children = childData.map(([ childData, children ]) => children);
  children = [].concat.apply([], children);

  let subWindowData = childData.map(([ subWindowData, children ], i) => shrinker(subWindowData, i, childData.length, depth));

  let windowData = {};

  subWindowData.forEach(subWindowData => {
    iterKeys(subWindowData).forEach(key => {
      windowData[key] = subWindowData[key];
    });
  });

  return [ windowData, children ];
}

function lastActiveDescendant(node){
  if (node.kind === 'window'){
    return node.lastActiveTime;
  } else if (node.kind == 'root'){
    return node.lastActiveTime;
  } else if (node.kind === 'vertical' || node.kind === 'horizontal' || node.kind === 'tab') {
    let times = node.children.map(lastActiveDescendant);
    times.push(node.lastActiveTime);
    return Math.max(...times);
  }
}

function tabifyPositions(node, activeNodeId, onSwitchTab, depth) {
  let childData = node.children.map(child => treeToData(child, activeNodeId, onSwitchTab, depth+1));
  let children = childData.map(([ childData, children ]) => children);
  children = [].concat.apply([], children);

  let subWindowData = childData.map(([ subWindowData, children ], i) => subWindowData);

  let windowData = {}

  let childrenLastActiveTime = node.children.map(child => lastActiveDescendant(child));

  let mostRecentChild = childrenLastActiveTime.indexOf(Math.max(...childrenLastActiveTime));

  if (children.length > 1){

    let tabHeight = 10;

    subWindowData.forEach(subWindowData => {
      iterKeys(subWindowData).forEach(key => {
        if (subWindowData[key].position.y === 0){
          subWindowData[key].pposition.y += tabHeight;
          subWindowData[key].pposition.h -= tabHeight;
        }
      });
    });

    subWindowData.forEach((subSubWindowData, i) => {

      let tabSwitcher = {
        isTab: true,
        depth: depth,
        tabPosition: i,
        activeTab: mostRecentChild,
        internal: true,
        tabChildren: iterKeys(subSubWindowData),
        position: {
          x: 1.0*i / subWindowData.length,
          y: 0.0,
          w: 1.0 / subWindowData.length,
          h: 0.0,
        },
        pposition: {
          x: 0,
          y: 0,
          w: 0,
          h: tabHeight,
        },
        lastActiveTime: -1,
        hidden: false,
        border: {
          top: '',
          bottom: '',
          left: '',
          right: '',
        }
      }

      let switchTab = (() => {
        onSwitchTab(node.id, i);
      });

      let r = Math.random();
      windowData[r] = tabSwitcher;
      if (i === mostRecentChild) {
        children.push(<div key={r} style={{ height: tabHeight, backgroundColor: '#448', color: 'white' }}>{'\u00A0'}</div>);
      } else {
        children.push(<div key={r} onClick={switchTab} style={{ height: tabHeight, backgroundColor: '#112', color: 'white' }}>{'\u00A0'}</div>);
      }
    });


  }

  let mostRecentSubWindowData = subWindowData.splice(mostRecentChild, 1)[0];

  subWindowData.forEach(subWindowData => {
    iterKeys(subWindowData).forEach(key => {
      subWindowData[key].hidden = true;
      windowData[key] = subWindowData[key];
    });
  });

  iterKeys(mostRecentSubWindowData).forEach(key => {
    windowData[key] = mostRecentSubWindowData[key];
  });

  return [ windowData, children ];
}

const borderStyleActive = '2px solid #448';
const borderStyleInactive = '2px solid #112'; 
function emptyRect () { 
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function treeToData(node, activeNodeId, onSwitchTab, depth) {
  if (node.kind === 'window'){
    var windowData = {}
    windowData[node.child.key] = {};
    windowData[node.child.key].border = {}
    let borderStyle;
    if (activeNodeId === node.id){
      borderStyle = borderStyleActive;
    }
    else {
      borderStyle = borderStyleInactive;
    }
    windowData[node.child.key].border.top = borderStyle;
    windowData[node.child.key].border.bottom = '';//borderStyle;
    windowData[node.child.key].border.left = '';//borderStyle;
    windowData[node.child.key].border.right = '';//borderStyle;
    windowData[node.child.key].isActive = activeNodeId === node.id;
    windowData[node.child.key].lastActiveTime = node.lastActiveTime;
    windowData[node.child.key].hidden = false;
    windowData[node.child.key].pposition = emptyRect();
    windowData[node.child.key].depth = depth;
    windowData[node.child.key].position = {
      x: 0,
      y: 0,
      w: 1.0,
      h: 1.0,
    }
    return [ windowData, [ node.child ] ];
  } else if (node.kind === 'root'){
    return treeToData(node.child, activeNodeId, onSwitchTab, depth+1);
  } else if (node.kind === 'horizontal'){
    return shrinkWindowPositions(node, horizontalShrinkWindowPositions, activeNodeId, onSwitchTab, depth+1);
  } else if (node.kind === 'vertical'){
    return shrinkWindowPositions(node, verticalShrinkWindowPositions, activeNodeId, onSwitchTab, depth+1);
  } else {
    return tabifyPositions(node, activeNodeId, onSwitchTab, depth+1);
  }
}

export default function TreeLayoutManager({ elemRef, activeNodeId, tree, onSwitchTab }: TreeLayoutProps) {
  let windowData, children;
  if (tree.child != null){
    [ windowData, children ] = treeToData(tree, activeNodeId, onSwitchTab, 0);
  }
  else {
    [ windowData, children ] = [ {}, [] ];
  }

  return (<WindowCompositor elemRef={elemRef} data={windowData}>
            {children}
          </WindowCompositor>)
}

