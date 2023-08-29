import { render } from './renderer'
import { createVNode } from './vnode'

export function createApp(rootComponent) {
  return {
    mount(rootContaner) {
      // 先转化成vnode
      //  component -> vode
      // 所有逻辑操作 都会基于 vnode 处理

      const vnode = createVNode(rootComponent)
      render(vnode, rootContaner)
    },
  }
}
