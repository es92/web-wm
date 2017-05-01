'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TreeLayoutWindowManager = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

// ======================================================

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _TreeLayout = require('./TreeLayout.js');

var _TreeLayout2 = _interopRequireDefault(_TreeLayout);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0;
    var v1 = r & 0x3;
    var v2 = 0x8;
    var v = c === 'x' ? r : v1 | v2;
    return v.toString(16);
  });
}

function getNodeById(node, parent, id) {
  if (node.id === id) {
    return [node, parent];
  } else if (node.kind === 'vertical' || node.kind === 'horizontal' || node.kind === 'tab') {
    return node.children.map(function (child) {
      return getNodeById(child, node, id);
    }).filter(function (n) {
      return n != null;
    })[0];
  } else if (node.kind === 'root') {
    return getNodeById(node.child, node, id);
  }
  return null;
}

function closeChildren(node) {
  if (node.kind === 'window') {
    if ('wm_close' in node.child) node.child.wm_close();
  } else if (node.kind === 'horizontal' || node.kind === 'vertical' || node.kind === 'tab') {
    node.children.forEach(function (c) {
      closeChildren(c);
    });
  } else if (node.kind === 'root') {
    if (node.child !== null) {
      closeChildren(node.child);
    }
  } else {
    console.log(node);
    throw new Error('nyi');
  }
}

function getNodeSize(node, windowData, wmWidth, wmHeight) {
  if (node.kind === 'window') {
    var d = windowData[node.id];

    var x = wmWidth * d.position.x + d.pposition.x;
    var w = wmWidth * d.position.w + d.pposition.w;

    var y = wmHeight * d.position.y + d.pposition.y;
    var h = wmHeight * d.position.h + d.pposition.h;

    return [x, y, w, h];
  } else if (node.kind === 'horizontal' || node.kind === 'vertical' || node.kind === 'tab') {
    var child_sizes = node.children.map(function (c) {
      return getNodeSize(c, windowData, wmWidth, wmHeight);
    });
    var child_boxes = child_sizes.map(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 4),
          x = _ref2[0],
          y = _ref2[1],
          w = _ref2[2],
          h = _ref2[3];

      return [x, y, x + w, y + h];
    });

    var _child_boxes$reduce = child_boxes.reduce(function (_ref3, _ref4) {
      var _ref6 = _slicedToArray(_ref3, 4),
          l1 = _ref6[0],
          t1 = _ref6[1],
          r1 = _ref6[2],
          b1 = _ref6[3];

      var _ref5 = _slicedToArray(_ref4, 4),
          l2 = _ref5[0],
          t2 = _ref5[1],
          r2 = _ref5[2],
          b2 = _ref5[3];

      return [Math.min(l1, l2), Math.min(t1, t2), Math.max(r1, r2), Math.max(b1, b2)];
    }),
        _child_boxes$reduce2 = _slicedToArray(_child_boxes$reduce, 4),
        _x = _child_boxes$reduce2[0],
        _y = _child_boxes$reduce2[1],
        _w = _child_boxes$reduce2[2],
        _h = _child_boxes$reduce2[3];

    return [_x, _y, _w, _h];
  } else {
    console.log(node);
    throw new Error('nyi');
  }
}

var TreeLayoutWindowManager = exports.TreeLayoutWindowManager = function (_Component) {
  _inherits(TreeLayoutWindowManager, _Component);

  function TreeLayoutWindowManager() {
    var _ref7;

    var _temp, _this, _ret;

    _classCallCheck(this, TreeLayoutWindowManager);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref7 = TreeLayoutWindowManager.__proto__ || Object.getPrototypeOf(TreeLayoutWindowManager)).call.apply(_ref7, [this].concat(args))), _this), _this.state = {
      lastActiveTime: 0,
      activeNodeId: '_root',
      activeGroupId: null,
      tree: { kind: 'root',
        lastActiveTime: -1,
        id: '_root',
        child: null }
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(TreeLayoutWindowManager, [{
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps, prevState) {
      if (this.state.activeNodeId !== prevState.activeNodeId) {
        var _getNodeById = getNodeById(this.state.tree, null, this.state.activeNodeId),
            _getNodeById2 = _slicedToArray(_getNodeById, 2),
            node = _getNodeById2[0],
            _ = _getNodeById2[1];

        if (node.kind === 'window') {
          node.child.props['data-onRequestFocus']();
        }
      }
    }
  }, {
    key: 'simplify',
    value: function simplify(parent, node) {
      var _this2 = this;

      if (node.kind === 'root') {
        if (node.child != null) {
          this.simplify(node, node.child);
        }
      } else if (node.kind === 'horizontal' || node.kind === 'vertical' || node.kind === 'tab') {
        if (node.children.length === 1) {
          if (parent.kind === 'root') {
            parent.child = node.children[0];
          } else if (node.kind === 'horizontal' || node.kind === 'vertical' || node.kind === 'tab') {
            var idx = parent.children.indexOf(node);
            parent.children[idx] = node.children[0];
          } else {
            throw new Error('nyi ' + node.kind);
          }
        } else {
          node.children.forEach(function (c) {
            return _this2.simplify(node, c);
          });
        }
      } else if (node.kind === 'window') {
        return;
      } else {
        throw new Error('nyi ' + node.kind);
      }
    }
  }, {
    key: 'focusParentGroup',
    value: function focusParentGroup() {
      var currentGroupId = this.state.activeGroupId;
      if (currentGroupId == null) {
        currentGroupId = this.state.activeNodeId;
      }

      var _getNodeById3 = getNodeById(this.state.tree, null, currentGroupId),
          _getNodeById4 = _slicedToArray(_getNodeById3, 2),
          _ = _getNodeById4[0],
          parent = _getNodeById4[1];

      if (parent !== null && parent.kind !== '_root') {
        this.setState({ activeGroupId: parent.id });
      }
    }
  }, {
    key: 'focusWindow',
    value: function focusWindow(key) {
      var _getNodeById5 = getNodeById(this.state.tree, null, key),
          _getNodeById6 = _slicedToArray(_getNodeById5, 2),
          node = _getNodeById6[0],
          _ = _getNodeById6[1];

      node.lastActiveTime = this.state.lastActiveTime + 1;
      this.simplify(null, this.state.tree);
      this.setState({ activeNodeId: key, activeGroupId: null, tree: this.state.tree, lastActiveTime: this.state.lastActiveTime + 1 });
    }
  }, {
    key: 'makeNewWindow',
    value: function makeNewWindow(win) {
      var _getNodeById7 = getNodeById(this.state.tree, null, this.state.activeNodeId),
          _getNodeById8 = _slicedToArray(_getNodeById7, 2),
          node = _getNodeById8[0],
          parent = _getNodeById8[1];

      var container = null;

      if (node.kind === 'window') {
        if (parent.kind === 'root') {
          container = {
            kind: 'horizontal',
            sizes: [1],
            lastActiveTime: -1,
            id: genUUID(),
            children: [node]
          };
          parent.child = container;
        } else {
          container = parent;
        }
      } else {
        container = node;
      }

      var newNode = {
        kind: 'window',
        id: win.key,
        lastActiveTime: -1,
        child: win
      };

      var activeNodeId = void 0;
      if (container.kind === 'root') {
        newNode.lastActiveTime = this.state.lastActiveTime + 1;
        activeNodeId = win.key;
        this.setState({});
        container.child = newNode;
      } else {
        activeNodeId = this.state.activeNodeId;
        container.children.push(newNode);
        container.sizes = container.sizes.map(function (s) {
          return s * (container.children.length - 1) / container.children.length;
        });
        container.sizes.push(1. / container.children.length);
      }

      this.setState({ tree: this.state.tree, lastActiveTime: this.state.lastActiveTime + 1, activeNodeId: activeNodeId, activeGroupId: null });
    }
  }, {
    key: 'closeKey',
    value: function closeKey(key) {
      if (key === this.state.activeNodeId) {
        this.closeActive();
      } else {
        this._closeId(key);
        if (key === '_root') {
          this.setState({ tree: this.state.tree, activeNodeId: '_root', activeGroupId: null });
        } else {
          this.setState({ tree: this.state.tree });
        }
      }
    }
  }, {
    key: 'closeActive',
    value: function closeActive() {
      var nodeId = this.state.activeGroupId;
      if (nodeId == null) {
        nodeId = this.state.activeNodeId;
      }
      var parentId = this._closeId(nodeId);

      var _getNodeById9 = getNodeById(this.state.tree, null, parentId),
          _getNodeById10 = _slicedToArray(_getNodeById9, 2),
          node = _getNodeById10[0],
          _ = _getNodeById10[1];

      var activeId = void 0;
      if (node.kind === 'vertical' || node.kind === 'horizontal' || node.kind === 'tab') {
        activeId = node.children[0].id;
      } else if (node.kind === 'root') {
        activeId = node.id;
      } else {
        console.log(node);
        throw new Error('nyi');
      }

      this.simplify(null, this.state.tree);

      this.setState({ tree: this.state.tree, activeNodeId: activeId, activeGroupId: null });
    }
  }, {
    key: '_closeId',
    value: function _closeId(id) {
      var _getNodeById11 = getNodeById(this.state.tree, null, id),
          _getNodeById12 = _slicedToArray(_getNodeById11, 2),
          node = _getNodeById12[0],
          parent = _getNodeById12[1];

      closeChildren(node);
      var parentId = void 0;
      if (node.kind === 'root') {
        parentId = node.id;
        if (node.child != null) {
          this._closeId(node.child.id);
        }
      } else if (parent.kind === 'root') {
        parent.child = null;
        parentId = parent.id;
      } else {
        var idx = parent.children.indexOf(node);
        parent.children.splice(idx, 1);
        parentId = parent.id;
        if (parent.children.length === 0) {
          parentId = this._closeId(parentId);
        }
        var rm_size = parent.sizes[idx];
        parent.sizes.splice(idx, 1);
        parent.sizes = parent.sizes.map(function (s) {
          return s + rm_size / parent.children.length;
        });
      }
      return parentId;
    }
  }, {
    key: 'makeVerticalSplit',
    value: function makeVerticalSplit() {
      this._makeNewSplit('vertical');
    }
  }, {
    key: 'makeHorizontalSplit',
    value: function makeHorizontalSplit() {
      this._makeNewSplit('horizontal');
    }
  }, {
    key: '_makeNewSplit',
    value: function _makeNewSplit(kind) {
      var _getNodeById13 = getNodeById(this.state.tree, null, this.state.activeNodeId),
          _getNodeById14 = _slicedToArray(_getNodeById13, 2),
          node = _getNodeById14[0],
          parent = _getNodeById14[1];

      if (node.kind === 'root') {
        return;
      }

      if (parent.kind === 'horizontal' || parent.kind === 'vertical' || parent.kind === 'tab') {
        var idx = parent.children.indexOf(node);
        var newNode = {
          kind: kind,
          lastActiveTime: -1,
          sizes: [1],
          id: genUUID(),
          children: [node]
        };
        parent.children[idx] = newNode;
        this.setState({ tree: this.state.tree, activeGroupId: newNode.id });
      } else if (parent.kind === 'root') {
        var _newNode = {
          kind: kind,
          lastActiveTime: -1,
          sizes: [1],
          id: genUUID(),
          children: [node]
        };
        parent.child = _newNode;
        this.setState({ tree: this.state.tree, activeGroupId: _newNode.id });
      }
    }
  }, {
    key: 'toggleCurrentOrientation',
    value: function toggleCurrentOrientation() {
      var node = void 0,
          parent = void 0;
      if (this.state.activeGroupId != null) {
        var agid = this.state.activeGroupId;
        if (agid === '_root') {
          agid = this.state.tree.child.id;
        }

        var _getNodeById15 = getNodeById(this.state.tree, null, agid);

        var _getNodeById16 = _slicedToArray(_getNodeById15, 2);

        node = _getNodeById16[0];
        parent = _getNodeById16[1];
      } else {
        var _getNodeById17 = getNodeById(this.state.tree, null, this.state.activeNodeId);

        var _getNodeById18 = _slicedToArray(_getNodeById17, 2);

        node = _getNodeById18[0];
        parent = _getNodeById18[1];
      }

      if (node.kind === 'root') return;

      var current = null;

      if (node.kind === 'horizontal' || node.kind === 'vertical' || node.kind === 'tab') {
        current = node;
      }
      if (current == null && (parent.kind === 'horizontal' || parent.kind === 'vertical' || parent.kind === 'tab')) {
        current = parent;
      }

      if (current !== null) {
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
  }, {
    key: 'switchToTabs',
    value: function switchToTabs() {
      var _getNodeById19 = getNodeById(this.state.tree, null, this.state.activeNodeId),
          _getNodeById20 = _slicedToArray(_getNodeById19, 2),
          node = _getNodeById20[0],
          parent = _getNodeById20[1];

      if (node.kind === 'root') return;

      var current = null;

      if (node.kind === 'horizontal' || node.kind === 'vertical' || node.kind === 'tab') {
        current = node;
      }
      if (current == null && (parent.kind === 'horizontal' || parent.kind === 'vertical' || parent.kind === 'tab')) {
        current = parent;
      }

      if (current !== null) {
        current.kind = 'tab';
      }
      this.setState({ tree: this.state.tree });
    }
  }, {
    key: 'switchTabs',
    value: function switchTabs(key, idx) {
      var _getNodeById21 = getNodeById(this.state.tree, null, key),
          _getNodeById22 = _slicedToArray(_getNodeById21, 2),
          node = _getNodeById22[0],
          _ = _getNodeById22[1];

      var child = node.children[idx];
      var childId = child.id;
      child.lastActiveTime = this.state.lastActiveTime + 1;
      this.setState({ activeNodeId: childId, activeGroupId: null, tree: this.state.tree, lastActiveTime: this.state.lastActiveTime + 1 });
    }
  }, {
    key: 'swapToPixels',
    value: function swapToPixels(node_id, x, y) {
      var _this3 = this;

      var _treeToData = (0, _TreeLayout.treeToData)(this.props.config, this.state.tree, '_root', null, 0),
          _treeToData2 = _slicedToArray(_treeToData, 2),
          windowData = _treeToData2[0],
          _ = _treeToData2[1];

      var wmHeight = this._dom_node.clientHeight;
      var wmWidth = this._dom_node.clientWidth;

      var contains = Object.keys(windowData).map(function (k) {
        var _getNodeById23 = getNodeById(_this3.state.tree, null, k),
            _getNodeById24 = _slicedToArray(_getNodeById23, 2),
            node = _getNodeById24[0],
            _ = _getNodeById24[1];

        var _getNodeSize = getNodeSize(node, windowData, wmWidth, wmHeight),
            _getNodeSize2 = _slicedToArray(_getNodeSize, 4),
            ax = _getNodeSize2[0],
            ay = _getNodeSize2[1],
            aw = _getNodeSize2[2],
            ah = _getNodeSize2[3];

        return [x >= ax && x <= ax + aw && y >= ay && y <= ay + ah, k];
      });
      var target_id = contains.filter(function (_ref8) {
        var _ref9 = _slicedToArray(_ref8, 2),
            c = _ref9[0],
            id = _ref9[1];

        return c;
      })[0][1];
      this.swapNodes(node_id, target_id);
    }
  }, {
    key: 'changeSizeByPixels',
    value: function changeSizeByPixels(node_id, dx, dy, x, y) {
      var _getNodeById25 = getNodeById(this.state.tree, null, node_id),
          _getNodeById26 = _slicedToArray(_getNodeById25, 2),
          node = _getNodeById26[0],
          parent = _getNodeById26[1];

      if ((parent.kind === 'horizontal' || parent.kind === 'vertical') && parent.sizes.length > 1) {
        var _treeToData3 = (0, _TreeLayout.treeToData)(this.props.config, this.state.tree, node_id, null, 0),
            _treeToData4 = _slicedToArray(_treeToData3, 2),
            windowData = _treeToData4[0],
            _ = _treeToData4[1];

        var wmHeight = this._dom_node.clientHeight;
        var wmWidth = this._dom_node.clientWidth;

        var _getNodeSize3 = getNodeSize(parent, windowData, wmWidth, wmHeight),
            _getNodeSize4 = _slicedToArray(_getNodeSize3, 4),
            _0 = _getNodeSize4[0],
            _1 = _getNodeSize4[1],
            paw = _getNodeSize4[2],
            pah = _getNodeSize4[3];

        var idx = parent.children.indexOf(node);
        var change_side = void 0;
        if (idx === 0) {
          change_side = 1;
        } else if (idx === parent.children.length - 1) {
          change_side = -1;
        } else {
          var _getNodeSize5 = getNodeSize(node, windowData, wmWidth, wmHeight),
              _getNodeSize6 = _slicedToArray(_getNodeSize5, 4),
              ax = _getNodeSize6[0],
              ay = _getNodeSize6[1],
              aw = _getNodeSize6[2],
              ah = _getNodeSize6[3];

          var dist_neg = void 0;
          var dist_pos = void 0;
          if (parent.kind === 'horizontal') {
            dist_neg = x - ax;
            dist_pos = ax + aw - x;
          } else if (parent.kind === 'vertical') {
            dist_neg = y - ay;
            dist_pos = ay + ah - y;
          }
          change_side = dist_neg < dist_pos ? -1 : 1;
        }
        var delta = void 0;
        if (parent.kind === 'horizontal') {
          delta = dx / paw * change_side;
        } else if (parent.kind === 'vertical') {
          delta = dy / pah * change_side;
        }
        var min_size = .01;
        if (parent.sizes[idx] + delta < min_size) {
          delta = min_size - parent.sizes[idx];
        }
        if (parent.sizes[idx + change_side] - delta < min_size) {
          delta = parent.sizes[idx + change_side] - min_size;
        }
        parent.sizes[idx] += delta;
        parent.sizes[idx + change_side] -= delta;
        this.setState({ tree: this.state.tree });
      }
    }
  }, {
    key: 'changeActiveSize',
    value: function changeActiveSize(delta) {
      var _getNodeById27 = getNodeById(this.state.tree, null, this.state.activeNodeId),
          _getNodeById28 = _slicedToArray(_getNodeById27, 2),
          node = _getNodeById28[0],
          parent = _getNodeById28[1];

      if ((parent.kind === 'horizontal' || parent.kind === 'vertical') && parent.sizes.length > 1) {
        var idx = parent.children.indexOf(node);
        var min_size = .01;
        if (parent.sizes[idx] + delta < min_size) {
          delta = min_size - parent.sizes[idx];
        } else if (1 - (parent.sizes[idx] + delta) < min_size * (parent.sizes.length - 1)) {
          delta = 1 - parent.sizes[idx] - min_size * (parent.sizes.length - 1);
        }
        parent.sizes[idx] += delta;
        var size_idxs = parent.sizes.map(function (s, i) {
          return [s, i];
        }).filter(function (s, i) {
          return i !== idx;
        });
        size_idxs = size_idxs.sort();
        var deltas = Array(size_idxs.length).fill(delta / (parent.sizes.length - 1));
        size_idxs.forEach(function (_ref10, j) {
          var _ref11 = _slicedToArray(_ref10, 2),
              s = _ref11[0],
              i = _ref11[1];

          parent.sizes[i] -= deltas[j];
          if (parent.sizes[i] < min_size) {
            var extra = min_size - parent.sizes[i];
            for (var k = j + 1; k < deltas.length; k++) {
              deltas[k] += extra / (deltas.length - (j + 1));
            }
            parent.sizes[i] = min_size;
          }
        });
        this.setState({ tree: this.state.tree });
      }
    }
  }, {
    key: 'moveActiveRight',
    value: function moveActiveRight() {
      this.moveActiveInDirection('right');
    }
  }, {
    key: 'moveActiveLeft',
    value: function moveActiveLeft() {
      this.moveActiveInDirection('left');
    }
  }, {
    key: 'moveActiveDown',
    value: function moveActiveDown() {
      this.moveActiveInDirection('down');
    }
  }, {
    key: 'moveActiveUp',
    value: function moveActiveUp() {
      this.moveActiveInDirection('up');
    }
  }, {
    key: 'moveActiveInDirection',
    value: function moveActiveInDirection(dir) {
      var nodeId = this.state.activeGroupId;
      if (nodeId == null) {
        nodeId = this.state.activeNodeId;
      }

      var _getNodeById29 = getNodeById(this.state.tree, null, nodeId),
          _getNodeById30 = _slicedToArray(_getNodeById29, 2),
          node = _getNodeById30[0],
          parent = _getNodeById30[1];

      var dirHor = dir === 'right' || dir === 'left';

      function rmChild(parent, child) {
        var idx = parent.children.indexOf(node);
        parent.children.splice(idx, 1);
        var rm_size = parent.sizes[idx];
        parent.sizes.splice(idx, 1);
        parent.sizes = parent.sizes.map(function (s) {
          return s + rm_size / parent.children.length;
        });
      }

      function addChild(parent, node_idx, node) {
        parent.children.splice(node_idx, 0, node);
        parent.sizes = parent.sizes.map(function (s) {
          return s * (parent.children.length - 1) / parent.children.length;
        });
        parent.sizes.splice(node_idx, 0, 1. / parent.children.length);
      }

      if (parent.children != null) {
        var parentHor = parent.kind === 'horizontal' || parent.kind === 'tab';

        var idx = parent.children.indexOf(node);
        var len = parent.children.length;

        var neighbor = void 0;

        if (dirHor && parentHor) {
          if (dir === 'left' && idx > 0) {
            neighbor = parent.children[idx - 1];
          } else if (dir === 'right' && idx < len - 1) {
            neighbor = parent.children[idx + 1];
          }
        } else if (!dirHor && !parentHor) {
          if (dir === 'up' && idx > 0) {
            neighbor = parent.children[idx - 1];
          } else if (dir === 'down' && idx < len - 1) {
            neighbor = parent.children[idx + 1];
          }
        }

        if (neighbor != null) {
          if (neighbor.kind === 'window') {

            if (parent.children.length === 2) {
              this.swapNodes(node.id, neighbor.id);
              return;
            } else if (parent.children.length === 1) {
              return;
            }

            var _idx = parent.children.indexOf(node);
            rmChild(parent, node);

            _idx = parent.children.indexOf(neighbor);

            var kind = !dirHor ? 'horizontal' : 'vertical';

            var newNode = {
              kind: kind,
              lastActiveTime: -1,
              sizes: [.5, .5],
              id: genUUID(),
              children: [node, neighbor]
            };

            parent.children[_idx] = newNode;

            this.simplify(null, this.state.tree);

            this.setState({ tree: this.state.tree });

            return;
          } else {
            var add_directly_to_neighbor = neighbor.kind === parent.kind || true;
            if (add_directly_to_neighbor) {
              var _idx2 = parent.children.indexOf(node);
              rmChild(parent, node);

              var end = dir === 'left' || dir === 'up';
              if (neighbor.kind !== parent.kind) {
                end = false;
              }

              _idx2 = end ? neighbor.children.length : 0;
              addChild(neighbor, _idx2, node);

              this.simplify(null, this.state.tree);

              this.setState({ tree: this.state.tree });
              return;
            } else {
              throw new Error('should not be reached');
            }
          }
        }
      }

      var _getNodeById31 = getNodeById(this.state.tree, null, parent.id),
          _getNodeById32 = _slicedToArray(_getNodeById31, 2),
          _ = _getNodeById32[0],
          grandparent = _getNodeById32[1];

      if (parent.kind === 'root') {
        return;
      }

      if (grandparent.kind === 'root') {

        var _kind = dirHor ? 'horizontal' : 'vertical';

        var _end = dir === 'right' || dir === 'down';

        var children = _end ? [grandparent.child, node] : [node, grandparent.child];

        var _newNode2 = {
          kind: _kind,
          lastActiveTime: -1,
          sizes: [.5, .5],
          id: genUUID(),
          children: children
        };

        rmChild(parent, node);

        grandparent.child = _newNode2;

        this.simplify(null, this.state.tree);
        this.setState({ tree: this.state.tree });
      } else {
        var _neighbor = grandparent;

        rmChild(parent, node);

        var _end2 = dir === 'right' || dir === 'down';

        var parent_idx = grandparent.children.indexOf(parent);

        var node_idx = _end2 ? parent_idx + 1 : parent_idx;

        addChild(_neighbor, node_idx, node);

        this.simplify(null, this.state.tree);

        this.setState({ tree: this.state.tree });
        return;
      }
    }
  }, {
    key: 'swapNodes',
    value: function swapNodes(id1, id2) {
      if (id1 === id2) {
        return;
      }

      var _getNodeById33 = getNodeById(this.state.tree, null, id1),
          _getNodeById34 = _slicedToArray(_getNodeById33, 2),
          node1 = _getNodeById34[0],
          parent1 = _getNodeById34[1];

      var _getNodeById35 = getNodeById(this.state.tree, null, id2),
          _getNodeById36 = _slicedToArray(_getNodeById35, 2),
          node2 = _getNodeById36[0],
          parent2 = _getNodeById36[1];

      if ((parent1.kind === 'vertical' || parent1.kind === 'horizontal' || parent1.kind === 'tab') && (parent2.kind === 'vertical' || parent2.kind === 'horizontal' || parent2.kind === 'tab')) {

        var idx1 = parent1.children.indexOf(node1);
        var idx2 = parent2.children.indexOf(node2);
        parent1.children[idx1] = node2;
        parent2.children[idx2] = node1;

        node1.lastActiveTime = this.state.lastActiveTime + 2;
        node2.lastActiveTime = this.state.lastActiveTime + 1;
      } else {
        throw new Error('nyi ' + parent1.kind + ' ' + parent2.kind);
      }
      this.setState({ tree: this.state.tree, lastActiveTime: this.state.lastActiveTime + 2 });
    }
  }, {
    key: 'moveActiveFocusTabIndex',
    value: function moveActiveFocusTabIndex(idx) {
      var nodeId = this.state.activeGroupId;
      if (nodeId == null || nodeId === '_root') {
        nodeId = this.state.activeNodeId;
      }

      this.moveActiveFocusTabIndexParent(nodeId, idx);
    }
  }, {
    key: 'moveActiveFocusTabIndexParent',
    value: function moveActiveFocusTabIndexParent(nodeId, idx) {
      var _getNodeById37 = getNodeById(this.state.tree, null, nodeId),
          _getNodeById38 = _slicedToArray(_getNodeById37, 2),
          node = _getNodeById38[0],
          parent = _getNodeById38[1];

      if (node.kind === 'tab') {
        idx = Math.min(idx, node.children.length - 1);
        this.focusWindow(node.children[idx].id);
      } else if (node.kind !== 'root') {
        this.moveActiveFocusTabIndexParent(parent.id, idx);
      }
    }
  }, {
    key: 'moveActiveFocusRight',
    value: function moveActiveFocusRight() {
      this.moveActiveFocusInDirection('right');
    }
  }, {
    key: 'moveActiveFocusLeft',
    value: function moveActiveFocusLeft() {
      this.moveActiveFocusInDirection('left');
    }
  }, {
    key: 'moveActiveFocusDown',
    value: function moveActiveFocusDown() {
      this.moveActiveFocusInDirection('down');
    }
  }, {
    key: 'moveActiveFocusUp',
    value: function moveActiveFocusUp() {
      this.moveActiveFocusInDirection('up');
    }
  }, {
    key: 'moveActiveFocusInDirection',
    value: function moveActiveFocusInDirection(dir) {
      var nodeId = this.state.activeGroupId;
      if (nodeId == null || nodeId === '_root' || nodeId === this.state.tree.child.id) {
        nodeId = this.state.activeNodeId;
      }

      var nextId = this.getInDirection(nodeId, dir);
      if (nextId != null) {
        nextId = this.descendToWindowFromDir(nextId, dir);
        this.focusWindow(nextId);
      }
    }
  }, {
    key: 'getInDirection',
    value: function getInDirection(nodeId, dir) {
      var _getNodeById39 = getNodeById(this.state.tree, null, nodeId),
          _getNodeById40 = _slicedToArray(_getNodeById39, 2),
          node = _getNodeById40[0],
          parent = _getNodeById40[1];

      if (parent.kind === 'tab') {
        return this.getInDirection(parent.id, dir);
      } else if (parent.kind === 'horizontal') {

        var idx = parent.children.indexOf(node);

        if (dir === 'right') {
          if (idx + 1 < parent.children.length) {
            return parent.children[idx + 1].id;
          } else {
            return this.getInDirection(parent.id, dir);
          }
        } else if (dir === 'left') {
          if (idx - 1 >= 0) {
            return parent.children[idx - 1].id;
          } else {
            return this.getInDirection(parent.id, dir);
          }
        } else {
          return this.getInDirection(parent.id, dir);
        }
      } else if (parent.kind === 'vertical') {

        var _idx3 = parent.children.indexOf(node);

        if (dir === 'down') {
          if (_idx3 + 1 < parent.children.length) {
            return parent.children[_idx3 + 1].id;
          } else {
            return this.getInDirection(parent.id, dir);
          }
        } else if (dir === 'up') {
          if (_idx3 - 1 >= 0) {
            return parent.children[_idx3 - 1].id;
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
  }, {
    key: 'descendToWindowFromDir',
    value: function descendToWindowFromDir(nodeId, dir) {
      var _getNodeById41 = getNodeById(this.state.tree, null, nodeId),
          _getNodeById42 = _slicedToArray(_getNodeById41, 2),
          node = _getNodeById42[0],
          _ = _getNodeById42[1];

      if (node.kind === 'window') {
        return node.id;
      } else if (node.kind === 'tab') {
        var lastActives = node.children.map(function (c) {
          return c.lastActiveTime;
        });
        var idx = lastActives.indexOf(Math.max.apply(Math, lastActives));
        return this.descendToWindowFromDir(node.children[idx].id, dir);
      } else if (node.kind === 'horizontal') {
        if (dir === 'right') {
          return this.descendToWindowFromDir(node.children[0].id, dir);
        } else if (dir === 'left') {
          return this.descendToWindowFromDir(node.children[node.children.length - 1].id, dir);
        } else {
          var _lastActives = node.children.map(function (c) {
            return c.lastActiveTime;
          });
          var _idx4 = _lastActives.indexOf(Math.max.apply(Math, _lastActives));
          return this.descendToWindowFromDir(node.children[_idx4].id, dir);
        }
      } else if (node.kind === 'vertical') {
        if (dir === 'down') {
          return this.descendToWindowFromDir(node.children[0].id, dir);
        } else if (dir === 'up') {
          return this.descendToWindowFromDir(node.children[node.children.length - 1].id, dir);
        } else {
          var _lastActives2 = node.children.map(function (c) {
            return c.lastActiveTime;
          });
          var _idx5 = _lastActives2.indexOf(Math.max.apply(Math, _lastActives2));
          return this.descendToWindowFromDir(node.children[_idx5].id, dir);
        }
      }
      return nodeId;
    }
  }, {
    key: 'render',
    value: function render() {
      var _this4 = this;

      return _react2.default.createElement(
        _TreeLayout2.default,
        { elemRef: function elemRef(r) {
            if (r != null) {
              _this4._dom_node = r;
            }
          }, tree: this.state.tree, activeNodeId: this.state.activeNodeId, activeGroupId: this.state.activeGroupId, onSwitchTab: this.switchTabs.bind(this), config: this.props.config },
        this.state.windows
      );
    }
  }]);

  return TreeLayoutWindowManager;
}(_react.Component);

