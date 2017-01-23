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

function verticalShrinkWindowPositions(windowData, i, n) {
  var shrunkWindowData = {}
  iterKeys(windowData).forEach(key => {
    shrunkWindowData[key] = {
      position: {
        x: windowData[key].position.x,
        y: i/n + windowData[key].position.y/n,
        w: windowData[key].position.w,
        h: windowData[key].position.h/n,
      },
      pposition: windowData[key].pposition,
      lastActiveTime: windowData[key].lastActiveTime,
      hidden: windowData[key].hidden,
      border: windowData[key].border,
    }
  });
  return shrunkWindowData;
}

function horizontalShrinkWindowPositions(windowData, i, n) {
  var shrunkWindowData = {}
  iterKeys(windowData).forEach(key => {
    shrunkWindowData[key] = {
      position: {
        x: i/n + windowData[key].position.x/n,
        y: windowData[key].position.y,
        w: windowData[key].position.w/n,
        h: windowData[key].position.h,
      },
      pposition: windowData[key].pposition,
      lastActiveTime: windowData[key].lastActiveTime,
      hidden: windowData[key].hidden,
      border: windowData[key].border,
    }
  });
  return shrunkWindowData;
}

function shrinkWindowPositions(node, shrinker, activeNodeId, onSwitchTab) {
  let childData = node.children.map(child => treeToData(child, activeNodeId, onSwitchTab));
  let children = childData.map(([ childData, children ]) => children);
  children = [].concat.apply([], children);

  let subWindowData = childData.map(([ subWindowData, children ], i) => shrinker(subWindowData, i, childData.length));

  let windowData = {};

  subWindowData.forEach(subWindowData => {
    iterKeys(subWindowData).forEach(key => {
      windowData[key] = subWindowData[key];
    });
  });

  return [ windowData, children ];
}

function tabifyPositions(node, activeNodeId, onSwitchTab) {
  let childData = node.children.map(child => treeToData(child, activeNodeId, onSwitchTab));
  let children = childData.map(([ childData, children ]) => children);
  children = [].concat.apply([], children);

  let subWindowData = childData.map(([ subWindowData, children ], i) => subWindowData);

  let windowData = {}


  let childrenLastActiveTime = node.children.map(child => child.lastActiveTime)

  let mostRecentChild = childrenLastActiveTime.indexOf(Math.max(...childrenLastActiveTime));

  if (children.length > 1){

    let tabHeight = 20;

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
        children.push(<div key={r} style={{ backgroundColor: 'cyan' }}>arst</div>);
      } else {
        children.push(<div key={r} onClick={switchTab} style={{ backgroundColor: 'navy' }}>arst</div>);
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

const borderStyleActive = '4px solid cyan';
const borderStyleInactive = '4px solid navy'; 
function emptyRect () { 
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function treeToData(node, activeNodeId, onSwitchTab) {
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
    windowData[node.child.key].position = {
      x: 0,
      y: 0,
      w: 1.0,
      h: 1.0,
    }
    return [ windowData, [ node.child ] ];
  } else if (node.kind === 'root'){
    return treeToData(node.child, activeNodeId, onSwitchTab);
  } else if (node.kind === 'horizontal'){
    return shrinkWindowPositions(node, horizontalShrinkWindowPositions, activeNodeId, onSwitchTab);
  } else if (node.kind === 'vertical'){
    return shrinkWindowPositions(node, verticalShrinkWindowPositions, activeNodeId, onSwitchTab);
  } else {
    return tabifyPositions(node, activeNodeId, onSwitchTab);
  }
}

export default function TreeLayoutManager({ elemRef, activeNodeId, tree, onSwitchTab }: TreeLayoutProps) {
  let windowData, children;
  if (tree.child != null){
    [ windowData, children ] = treeToData(tree, activeNodeId, onSwitchTab);
  }
  else {
    [ windowData, children ] = [ {}, [] ];
  }

  return (<WindowCompositor elemRef={elemRef} data={windowData}>
            {children}
          </WindowCompositor>)
}

