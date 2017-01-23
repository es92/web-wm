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

export default function WindowCompositor({ elemRef, data, children }: WindowCompositorProps) {
  return (<div ref={elemRef} style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                     }}>
         { children.filter((child) => !data[child.key].hidden)
                   .map((child) => {
           return (<div key={child.key} style={{
                        left: 100*data[child.key].position.x + '%', 
                        width: 100*data[child.key].position.w + '%', 
                        top: 'calc(' + 100*data[child.key].position.y + '%' + ' + ' + data[child.key].pposition.y + 'px)',
                        height: 'calc(' + 100*data[child.key].position.h + '%' + ' + ' + data[child.key].pposition.h + 'px)',
                        position: 'absolute',
                        boxSizing: 'border-box',
                        borderLeft: data[child.key].border.left,
                        borderTop: data[child.key].border.top,
                        borderBottom: data[child.key].border.bottom,
                        borderRight: data[child.key].border.right,
                    }}
              >
            {child}
           </div>)
          }
         ) }
         </div>)
}
