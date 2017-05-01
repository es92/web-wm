'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = WindowCompositor;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getStyling(child, data) {
  var style = {
    left: 'calc(' + 100 * data[child.key].position.x + '% + ' + data[child.key].pposition.x + 'px)',
    width: 'calc(' + 100 * data[child.key].position.w + '% + ' + data[child.key].pposition.w + 'px)',

    top: 'calc(' + 100 * data[child.key].position.y + '% + ' + data[child.key].pposition.y + 'px)',
    height: 'calc(' + 100 * data[child.key].position.h + '% + ' + data[child.key].pposition.h + 'px)',
    position: 'absolute',
    boxSizing: 'border-box',
    borderLeft: data[child.key].border.left,
    borderTop: data[child.key].border.top,
    borderBottom: data[child.key].border.bottom,
    borderRight: data[child.key].border.right
  };
  if (data[child.key].hidden) {
    style.visibility = 'hidden';
    style.zIndex = -1;
  }
  return style;
}

function WindowCompositor(_ref) {
  var elemRef = _ref.elemRef,
      data = _ref.data,
      children = _ref.children,
      groupHighlightColor = _ref.groupHighlightColor;

  var highlightColor = children.length === 0 ? 'white' : groupHighlightColor;
  return _react2.default.createElement(
    'div',
    { ref: elemRef, style: {
        background: highlightColor,
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      } },
    children.map(function (child) {
      return _react2.default.createElement(
        'div',
        { key: child.key, style: getStyling(child, data) },
        child
      );
    })
  );
}

