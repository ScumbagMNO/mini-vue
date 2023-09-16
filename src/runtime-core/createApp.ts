import { createVNode } from './vnode'

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 先转化成vnode
        //  component -> vode
        // 所有逻辑操作 都会基于 vnode 处理

        const vnode = createVNode(rootComponent)
        render(vnode, rootContainer)
      },
    }
  }
}
