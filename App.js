'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

require('./App.css');

var _WindowManager = require('./WindowManager.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

//import Vim from 'react-es-vim.js/ReactVim.js';

var App = function (_Component) {
  _inherits(App, _Component);

  function App() {
    _classCallCheck(this, App);

    return _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).apply(this, arguments));
  }

  _createClass(App, [{
    key: 'makeTestWindow',
    value: function makeTestWindow() {
      var _this2 = this;

      var key = '' + Math.random();
      var R = 128;
      var color = 'rgb(' + Math.floor(Math.random() * R) + ',' + Math.floor(Math.random() * R) + ',' + Math.floor(Math.random() * R) + ')';

      var onFocus = function onFocus(key, e) {
        _this2.wm.focusWindow(key);
      };

      var onMouseOver = function onMouseOver(key, e) {
        e.target.focus();
      };

      var onRequestFocus = function onRequestFocus() {};

      var newWindow = _react2.default.createElement(
        'div',
        { tabIndex: '0',
          key: key,
          'data-onRequestFocus': onRequestFocus,
          onMouseOver: onMouseOver.bind(this, key),
          onFocus: onFocus.bind(this, key),
          style: { backgroundColor: color, width: '100%', height: '100%' } },
        key
      );
      return newWindow;
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this3 = this;

      var mousedown = false;
      var last_mouse_x = -1;
      var last_mouse_y = -1;
      var active_node_id = null;

      window.addEventListener('mousedown', function (e) {
        last_mouse_x = e.clientX;
        last_mouse_y = e.clientY;
        active_node_id = _this3.wm.state.activeNodeId;
        mousedown = true;
      });
      window.addEventListener('mouseup', function (e) {
        mousedown = false;
      });
      window.addEventListener('dragend', function (e) {
        mousedown = false;
      });
      window.addEventListener('mouseleave', function (e) {
        mousedown = false;
      });

      window.oncontextmenu = function (e) {
        if (e.altKey) return false;
      };

      window.addEventListener('mousemove', function (e) {
        if (mousedown && e.altKey) {
          var dx = e.clientX - last_mouse_x;
          var dy = e.clientY - last_mouse_y;

          if (e.button === 2) {
            _this3.wm.changeSizeByPixels(active_node_id, dx, dy, e.clientX, e.clientY);
          } else if (e.button === 0) {
            _this3.wm.swapToPixels(active_node_id, e.clientX, e.clientY);
          }

          last_mouse_x = e.clientX;
          last_mouse_y = e.clientY;
        }
      });

      window.addEventListener('keydown', function (e) {
        if (!e.altKey) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();

        if (e.ctrlKey) {
          if (e.key === 'n') {
            _this3.wm.changeActiveSize(-.1);
          } else if (e.key === 'i') {
            _this3.wm.changeActiveSize(.1);
          }
        } else if (e.key === 'Enter') {
          _this3.wm.makeNewWindow(_this3.makeTestWindow());
        } else if (e.key === 'f') {
          _this3.wm.toggleCurrentOrientation();
        } else if (e.key === 'w') {
          _this3.wm.switchToTabs();
        } else if (e.key === 'b') {
          _this3.wm.makeVerticalSplit();
        } else if (e.key === 'h') {
          _this3.wm.makeHorizontalSplit();
        } else if (e.key === 'c') {
          _this3.wm.closeActive();
        } else if (e.key === 'q') {
          _this3.wm.focusParentGroup();
        } else if (e.key === 'n') {
          _this3.wm.moveActiveFocusLeft();
        } else if (e.key === 'i') {
          _this3.wm.moveActiveFocusRight();
        } else if (e.key === 'u') {
          _this3.wm.moveActiveFocusUp();
        } else if (e.key === 'e') {
          _this3.wm.moveActiveFocusDown();
        } else if (e.key === 'N') {
          _this3.wm.moveActiveLeft();
        } else if (e.key === 'I') {
          _this3.wm.moveActiveRight();
        } else if (e.key === 'U') {
          _this3.wm.moveActiveUp();
        } else if (e.key === 'E') {
          _this3.wm.moveActiveDown();
        } else if (e.key >= '1' && e.key <= '9') {
          _this3.wm.moveActiveFocusTabIndex(parseInt(e.key, 10) - 1);
        }

        return false;
      });

      setTimeout(function () {
        _this3.wm.makeNewWindow(_this3.makeTestWindow());
        _this3.wm.closeActive();
      }, 500);
    }
  }, {
    key: 'render',
    value: function render() {
      var _this4 = this;

      var config = {
        activeColor: '#55b',
        inactiveColor: '#112',
        groupHighlightColor: '#55b',
        windowBarHeight: '4px',
        tabHeightPx: 20
      };

      return _react2.default.createElement(_WindowManager.TreeLayoutWindowManager, { ref: function ref(r) {
          return _this4.wm = r;
        }, maybeGetWindow: this.maybeGetWindow, config: config });
    }
  }]);

  return App;
}(_react.Component);

exports.default = App;

