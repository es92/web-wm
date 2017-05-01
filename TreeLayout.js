'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.treeToData = treeToData;
exports.default = TreeLayoutManager;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _WindowCompositor = require('./WindowCompositor.js');

var _WindowCompositor2 = _interopRequireDefault(_WindowCompositor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function iterKeys(obj) {
  var keys = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
    }
  }
  return keys;
}

function verticalShrinkWindowPositions(windowData, _ref, n, depth) {
  var _ref2 = _slicedToArray(_ref, 2),
      start = _ref2[0],
      end = _ref2[1];

  var shrunkWindowData = {};
  iterKeys(windowData).forEach(function (key) {
    shrunkWindowData[key] = _extends({}, windowData[key]);
    shrunkWindowData[key].position = {
      x: windowData[key].position.x,
      y: start + windowData[key].position.y * (end - start),
      w: windowData[key].position.w,
      h: windowData[key].position.h * (end - start)
    };
  });
  return shrunkWindowData;
}

function horizontalShrinkWindowPositions(windowData, _ref3, n, depth) {
  var _ref4 = _slicedToArray(_ref3, 2),
      start = _ref4[0],
      end = _ref4[1];

  var shrunkWindowData = {};
  iterKeys(windowData).forEach(function (key) {
    shrunkWindowData[key] = _extends({}, windowData[key]);
    shrunkWindowData[key].position = {
      x: start + windowData[key].position.x * (end - start),
      y: windowData[key].position.y,
      w: windowData[key].position.w * (end - start),
      h: windowData[key].position.h
    };
  });
  return shrunkWindowData;
}

function shrinkWindowPositions(config, node, shrinker, activeNodeId, activeGroupId, onSwitchTab, depth) {
  var childData = node.children.map(function (child) {
    return treeToData(config, child, activeNodeId, activeGroupId, onSwitchTab, depth + 1);
  });
  var children = childData.map(function (_ref5) {
    var _ref6 = _slicedToArray(_ref5, 2),
        childData = _ref6[0],
        children = _ref6[1];

    return children;
  });
  children = [].concat.apply([], children);

  var dividers = node.sizes.reduce(function (a, b) {
    return a.concat([b + a[a.length - 1]]);
  }, [0]);
  var starts = dividers.slice(0, dividers.length - 1);
  var ends = dividers.slice(1, dividers.length);

  var positions = starts.map(function (a, i) {
    return [starts[i], ends[i]];
  });

  var subWindowData = childData.map(function (_ref7, i) {
    var _ref8 = _slicedToArray(_ref7, 2),
        subWindowData = _ref8[0],
        children = _ref8[1];

    return shrinker(subWindowData, positions[i], childData.length, depth);
  });

  var windowData = {};

  subWindowData.forEach(function (subWindowData) {
    iterKeys(subWindowData).forEach(function (key) {
      windowData[key] = subWindowData[key];
    });
  });

  return [windowData, children];
}

function lastActiveDescendant(node) {
  if (node.kind === 'window') {
    return node.lastActiveTime;
  } else if (node.kind === 'root') {
    return node.lastActiveTime;
  } else if (node.kind === 'vertical' || node.kind === 'horizontal' || node.kind === 'tab') {
    var times = node.children.map(lastActiveDescendant);
    times.push(node.lastActiveTime);
    return Math.max.apply(Math, _toConsumableArray(times));
  }
}

function tabifyPositions(config, node, activeNodeId, activeGroupId, onSwitchTab, depth) {
  var childData = node.children.map(function (child) {
    return treeToData(config, child, activeNodeId, activeGroupId, onSwitchTab, depth + 1);
  });
  var children = childData.map(function (_ref9) {
    var _ref10 = _slicedToArray(_ref9, 2),
        childData = _ref10[0],
        children = _ref10[1];

    return children;
  });
  children = [].concat.apply([], children);

  var subWindowData = childData.map(function (_ref11, i) {
    var _ref12 = _slicedToArray(_ref11, 2),
        subWindowData = _ref12[0],
        children = _ref12[1];

    return subWindowData;
  });

  var windowData = {};

  var childrenLastActiveTime = node.children.map(function (child) {
    return lastActiveDescendant(child);
  });

  var mostRecentChild = childrenLastActiveTime.indexOf(Math.max.apply(Math, _toConsumableArray(childrenLastActiveTime)));

  if (children.length > 1) {

    var tabHeight = config.tabHeightPx;

    subWindowData.forEach(function (subWindowData) {
      iterKeys(subWindowData).forEach(function (key) {
        if (subWindowData[key].position.y === 0) {
          subWindowData[key].pposition.y += tabHeight;
          subWindowData[key].pposition.h -= tabHeight;
        }
      });
    });

    subWindowData.forEach(function (subSubWindowData, i) {

      var tabSwitcher = {
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
          h: 0.0
        },
        pposition: {
          x: 1.0 * i * tabHeight,
          y: 0,
          w: tabHeight,
          h: tabHeight
        },
        lastActiveTime: -1,
        hidden: false,
        border: {
          top: '',
          bottom: '',
          left: '',
          right: ''
        }
      };

      var switchTab = function switchTab() {
        onSwitchTab(node.id, i);
      };

      var r = Math.random();
      windowData[r] = tabSwitcher;

      var tabFontSize = tabHeight * 3 / 4;
      if (i === mostRecentChild) {
        //let contents = '\u00A0';
        var _contents = i + 1;
        children.push(_react2.default.createElement(
          'div',
          { key: r, style: { height: tabHeight, backgroundColor: config.activeColor, color: 'white', fontSize: tabFontSize, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          _contents
        ));
      } else {
        //let contents = '\u00A0';
        var _contents2 = i + 1;
        children.push(_react2.default.createElement(
          'div',
          { key: r, onClick: switchTab, style: { height: tabHeight, backgroundColor: config.inactiveColor, color: 'white', fontSize: tabFontSize, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
          _contents2
        ));
      }
    });

    var offset = subWindowData.length * tabHeight;
    var r = Math.random();
    windowData[r] = {
      internal: true,
      position: {
        x: 0.0,
        y: 0.0,
        w: 1.0,
        h: 0.0
      },
      pposition: {
        x: offset,
        y: 0.0,
        w: -offset,
        h: tabHeight
      },
      lastActiveTime: -1,
      hidden: false,
      border: {
        top: '',
        bottom: '',
        left: '',
        right: ''
      }
    };
    var contents = '\xA0';
    children.push(_react2.default.createElement(
      'div',
      { key: r, style: { height: tabHeight, backgroundColor: config.inactiveColor, color: 'white' } },
      contents
    ));
  }

  var mostRecentSubWindowData = subWindowData.splice(mostRecentChild, 1)[0];

  subWindowData.forEach(function (subWindowData) {
    iterKeys(subWindowData).forEach(function (key) {
      subWindowData[key].hidden = true;
      windowData[key] = subWindowData[key];
    });
  });

  iterKeys(mostRecentSubWindowData).forEach(function (key) {
    windowData[key] = mostRecentSubWindowData[key];
  });

  return [windowData, children];
}

function emptyRect() {
  return { x: 0, y: 0, w: 0, h: 0 };
}

function treeToData(config, node, activeNodeId, activeGroupId, onSwitchTab, depth) {
  var windowData = {},
      children = [];

  if (node.kind === 'window') {
    windowData[node.child.key] = {};
    windowData[node.child.key].border = {};
    var borderStyle = void 0;
    if (activeNodeId === node.id) {
      borderStyle = config.windowBarHeight + ' solid ' + config.activeColor;
    } else {
      borderStyle = config.windowBarHeight + ' solid ' + config.inactiveColor;
    }
    windowData[node.child.key].border.top = borderStyle;
    windowData[node.child.key].border.bottom = ''; //borderStyle;
    windowData[node.child.key].border.left = ''; //borderStyle;
    windowData[node.child.key].border.right = ''; //borderStyle;
    windowData[node.child.key].isActive = activeNodeId === node.id;
    windowData[node.child.key].lastActiveTime = node.lastActiveTime;
    windowData[node.child.key].hidden = false;
    windowData[node.child.key].pposition = emptyRect();
    windowData[node.child.key].depth = depth;
    windowData[node.child.key].position = {
      x: 0,
      y: 0,
      w: 1.0,
      h: 1.0
    };
    children = [node.child];
  } else if (node.kind === 'root') {
    var _treeToData = treeToData(config, node.child, activeNodeId, activeGroupId, onSwitchTab, depth + 1);

    var _treeToData2 = _slicedToArray(_treeToData, 2);

    windowData = _treeToData2[0];
    children = _treeToData2[1];
  } else if (node.kind === 'horizontal') {
    var _shrinkWindowPosition = shrinkWindowPositions(config, node, horizontalShrinkWindowPositions, activeNodeId, activeGroupId, onSwitchTab, depth + 1);

    var _shrinkWindowPosition2 = _slicedToArray(_shrinkWindowPosition, 2);

    windowData = _shrinkWindowPosition2[0];
    children = _shrinkWindowPosition2[1];
  } else if (node.kind === 'vertical') {
    var _shrinkWindowPosition3 = shrinkWindowPositions(config, node, verticalShrinkWindowPositions, activeNodeId, activeGroupId, onSwitchTab, depth + 1);

    var _shrinkWindowPosition4 = _slicedToArray(_shrinkWindowPosition3, 2);

    windowData = _shrinkWindowPosition4[0];
    children = _shrinkWindowPosition4[1];
  } else {
    var _tabifyPositions = tabifyPositions(config, node, activeNodeId, activeGroupId, onSwitchTab, depth + 1);

    var _tabifyPositions2 = _slicedToArray(_tabifyPositions, 2);

    windowData = _tabifyPositions2[0];
    children = _tabifyPositions2[1];
  }

  if (node.id === activeGroupId) {
    var W = 4;
    Object.keys(windowData).forEach(function (child) {
      var win = windowData[child];
      if (win.position.x === 0) {
        win.pposition.x += W;
        win.pposition.w -= W;
      }
      if (win.position.y === 0) {
        win.pposition.y += W;
        win.pposition.h -= W;
      }
      if (win.position.x + win.position.w === 1) {
        win.pposition.w -= W;
      }
      if (win.position.y + win.position.h === 1) {
        win.pposition.h -= W;
      }
    });
  }

  return [windowData, children];
}

function TreeLayoutManager(_ref13) {
  var config = _ref13.config,
      elemRef = _ref13.elemRef,
      activeNodeId = _ref13.activeNodeId,
      activeGroupId = _ref13.activeGroupId,
      tree = _ref13.tree,
      onSwitchTab = _ref13.onSwitchTab;

  var windowData = void 0,
      children = void 0;
  if (tree.child != null) {
    var _treeToData3 = treeToData(config, tree, activeNodeId, activeGroupId, onSwitchTab, 0);

    var _treeToData4 = _slicedToArray(_treeToData3, 2);

    windowData = _treeToData4[0];
    children = _treeToData4[1];
  } else {
    windowData = {};
    children = [];
  }

  return _react2.default.createElement(
    _WindowCompositor2.default,
    { elemRef: elemRef, data: windowData, groupHighlightColor: config.groupHighlightColor },
    children
  );
}

