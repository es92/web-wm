'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = PercentLayoutManager;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _WindowCompositor = require('./WindowCompositor.js');

var _WindowCompositor2 = _interopRequireDefault(_WindowCompositor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function PercentLayoutManager(_ref) {
  var orientation = _ref.orientation,
      children = _ref.children;

  var windowPositions = {};

  var window_percent = 1. / children.length;

  if (orientation === 'vertical') {
    children.forEach(function (child, i) {
      windowPositions[child.key] = {
        x: 0,
        y: i * window_percent,
        w: 1.,
        h: window_percent
      };
    });
  } else {
    children.forEach(function (child, i) {
      windowPositions[child.key] = {
        x: i * window_percent,
        y: 0,
        w: window_percent,
        h: 1
      };
    });
  }

  return _react2.default.createElement(
    _WindowCompositor2.default,
    { positions: windowPositions },
    children
  );
}

