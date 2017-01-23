// @flow

import React from 'react';

import WindowCompositor from './WindowCompositor.js'

type PercentLayoutProps = {
  children: Array<React$Element>,
  orientation: 'horizontal' | 'vertical',
}

export default function PercentLayoutManager({ orientation, children }: PercentLayoutProps) {
  let windowPositions = {};

  let window_percent = 1./children.length;

  if (orientation === 'vertical') {
    children.forEach((child, i) => {
      windowPositions[child.key] = {
        x: 0,
        y: i*window_percent,
        w: 1.,
        h: window_percent,
      }
    });
  } else {
    children.forEach((child, i) => {
      windowPositions[child.key] = {
        x: i*window_percent,
        y: 0,
        w: window_percent,
        h: 1,
      }
    });
  }
  
  return (<WindowCompositor positions={windowPositions}>
            {children}
          </WindowCompositor>)
}
