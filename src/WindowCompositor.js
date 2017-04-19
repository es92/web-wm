// @flow

import React from 'react';

export type Rect = {
  x: number,
  y: number,
  w: number,
  h: number
}

type WindowCompositorProps = {
  data: { [ key: string ]:  {
    position: Rect,
    pposition: Rect,
    border: {
      left: string,
      right: string,
      top: string,
      botom: string,
    },
    lastActiveTime: long,
    hidden: boolean,
    isActive: boolean
  } },
  children: Array<React$Element<key>>,

}

function getStyling(child, data){
  let style = {
        left: 'calc(' + 100*data[child.key].position.x + '% + ' + data[child.key].pposition.x + 'px)',
        width: 'calc(' + 100*data[child.key].position.w + '% + ' + data[child.key].pposition.w + 'px)',

        top: 'calc(' + 100*data[child.key].position.y + '% + ' + data[child.key].pposition.y + 'px)',
        height: 'calc(' + 100*data[child.key].position.h + '% + ' + data[child.key].pposition.h + 'px)',
        position: 'absolute',
        boxSizing: 'border-box',
        borderLeft: data[child.key].border.left,
        borderTop: data[child.key].border.top,
        borderBottom: data[child.key].border.bottom,
        borderRight: data[child.key].border.right,
    };
  if (data[child.key].hidden){
    style.visibility = 'hidden'
    style.zIndex = -1;
  }
  return style;
}

export default function WindowCompositor({ elemRef, data, children, groupHighlightColor }: WindowCompositorProps) {
  let highlightColor = children.length === 0 ? 'white' : groupHighlightColor;
  return (<div ref={elemRef} style={{
                      background: highlightColor,
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                     }}>
        {  children.map((child) => {
           return (<div key={child.key} style={getStyling(child, data)}>
            {child}
           </div>)
          }
         ) }
         </div>)
}
