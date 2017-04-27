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

function verticalShrinkWindowPositions(windowData, [ start, end ], n, depth) {
  var shrunkWindowData = {}
  iterKeys(windowData).forEach(key => {
    shrunkWindowData[key] = { ...windowData[key] };
    shrunkWindowData[key].position = {
      x: windowData[key].position.x,
      y: start + windowData[key].position.y*(end - start),
      w: windowData[key].position.w,
      h: windowData[key].position.h*(end - start),
    };
  });
  return shrunkWindowData;
}

function horizontalShrinkWindowPositions(windowData, [ start, end ], n, depth) {
  var shrunkWindowData = {}
  iterKeys(windowData).forEach(key => {
    shrunkWindowData[key] = { ...windowData[key] };
    shrunkWindowData[key].position = {
      x: start + windowData[key].position.x*(end - start),
      y: windowData[key].position.y,
      w: windowData[key].position.w*(end - start),
      h: windowData[key].position.h,
    };
  });
  return shrunkWindowData;
}

function shrinkWindowPositions(config, node, shrinker, activeNodeId, activeGroupId, onSwitchTab, depth) {
  let childData = node.children.map(child => treeToData(config, child, activeNodeId, activeGroupId, onSwitchTab, depth+1));
  let children = childData.map(([ childData, children ]) => children);
  children = [].concat.apply([], children);

  let dividers = node.sizes.reduce((a,b) => a.concat([b+a[a.length-1]]), [0]);
  let starts = dividers.slice(0,dividers.length-1);
  let ends = dividers.slice(1,dividers.length);

  let positions = starts.map((a,i) => [ starts[i], ends[i] ]);

  let subWindowData = childData.map(([ subWindowData, children ], i) => shrinker(subWindowData, positions[i], childData.length, depth));

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
  } else if (node.kind === 'root'){
    return node.lastActiveTime;
  } else if (node.kind === 'vertical' || node.kind === 'horizontal' || node.kind === 'tab') {
    let times = node.children.map(lastActiveDescendant);
    times.push(node.lastActiveTime);
    return Math.max(...times);
  }
}

function tabifyPositions(config, node, activeNodeId, activeGroupId, onSwitchTab, depth) {
  let childData = node.children.map(child => treeToData(config, child, activeNodeId, activeGroupId, onSwitchTab, depth+1));
  let children = childData.map(([ childData, children ]) => children);
  children = [].concat.apply([], children);

  let subWindowData = childData.map(([ subWindowData, children ], i) => subWindowData);

  let windowData = {}

  let childrenLastActiveTime = node.children.map(child => lastActiveDescendant(child));

  let mostRecentChild = childrenLastActiveTime.indexOf(Math.max(...childrenLastActiveTime));

  if (children.length > 1){

    let tabHeight = config.tabHeightPx;

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
        //position: {
        //  x: 1.0*i / subWindowData.length,
        //  y: 0.0,
        //  w: 1.0 / subWindowData.length,
        //  h: 0.0,
        //},
        //pposition: {
        //  x: 0,
        //  y: 0,
        //  w: 0,
        //  h: tabHeight,
        //},
        position: {
          x: 0.0,
          y: 0.0,
          w: 0.0,
          h: 0.0,
        },
        pposition: {
          x: 1.0*i*tabHeight,
          y: 0,
          w: tabHeight,
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

      let tabFontSize = tabHeight*3/4;
      if (i === mostRecentChild) {
        //let contents = '\u00A0';
        let contents = i+1;
        children.push(<div key={r} style={{ height: tabHeight, backgroundColor: config.activeColor, color: 'white', fontSize: tabFontSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{contents}</div>);
      } else {
        //let contents = '\u00A0';
        let contents = i+1;
        children.push(<div key={r} onClick={switchTab} style={{ height: tabHeight, backgroundColor: config.inactiveColor, color: 'white', fontSize: tabFontSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{contents}</div>);
      }
    });


    let offset = subWindowData.length*tabHeight;
    let r = Math.random();
    windowData[r] = {
      internal: true,
      position: {
        x: 0.0,
        y: 0.0,
        w: 1.0,
        h: 0.0,
      },
      pposition: {
        x: offset,
        y: 0.0,
        w: -offset,
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
    };
    let contents = '\u00A0';
    children.push(<div key={r} style={{ height: tabHeight, backgroundColor: config.inactiveColor, color: 'white' }}>{contents}</div>);

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

function emptyRect () { 
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function treeToData(config, node, activeNodeId, activeGroupId, onSwitchTab, depth) {

  let [ windowData, children ] = [ {}, [] ];
  if (node.kind === 'window'){
    windowData[node.child.key] = {};
    windowData[node.child.key].border = {}
    let borderStyle;
    if (activeNodeId === node.id){
      borderStyle = config.windowBarHeight + ' solid ' + config.activeColor;
    }
    else {
      borderStyle = config.windowBarHeight + ' solid ' + config.inactiveColor;
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
    children = [ node.child ];
  } else if (node.kind === 'root'){
    [ windowData, children ] = treeToData(config, node.child, activeNodeId, activeGroupId, onSwitchTab, depth+1);
  } else if (node.kind === 'horizontal'){
    [ windowData, children ] = shrinkWindowPositions(config, node, horizontalShrinkWindowPositions, activeNodeId, activeGroupId, onSwitchTab, depth+1);
  } else if (node.kind === 'vertical'){
    [ windowData, children ] = shrinkWindowPositions(config, node, verticalShrinkWindowPositions, activeNodeId, activeGroupId, onSwitchTab, depth+1);
  } else {
    [ windowData, children ] = tabifyPositions(config, node, activeNodeId, activeGroupId, onSwitchTab, depth+1);
  }


  if (node.id === activeGroupId){
    let W = 4;
    Object.keys(windowData).forEach((child) => {
      let win = windowData[child]
      if (win.position.x === 0){
        win.pposition.x += W;
        win.pposition.w -= W;
      }
      if (win.position.y === 0){
        win.pposition.y += W;
        win.pposition.h -= W;
      }
      if (win.position.x + win.position.w === 1){
        win.pposition.w -= W;
      }
      if (win.position.y + win.position.h === 1){
        win.pposition.h -= W;
      }
    });
  }

  return [ windowData, children ];
}

export default function TreeLayoutManager({ config, elemRef, activeNodeId, activeGroupId, tree, onSwitchTab }: TreeLayoutProps) {
  let windowData, children;
  if (tree.child != null){
    [ windowData, children ] = treeToData(config, tree, activeNodeId, activeGroupId, onSwitchTab, 0);
  }
  else {
    [ windowData, children ] = [ {}, [] ];
  }

  return (<WindowCompositor elemRef={elemRef} data={windowData} groupHighlightColor={config.groupHighlightColor}>
            {children}
          </WindowCompositor>)
}

