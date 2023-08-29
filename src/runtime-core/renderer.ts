import { createComponentInstance, setupComponent } from './components'

export function render(vnode, container) {
  // patch
  //
  patch(vnode, container)
}

function patch(vnode, container) {
  // 处理组件
  // 判断是不是Element
  processComponent(vnode, container)
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}

function mountComponent(vnode: any, container) {
  // 创建组件实例
  const instance = createComponentInstance(vnode)

  setupComponent(instance)

  setupRenderEffect(instance, container)
}

function setupRenderEffect(instance: any, container) {
  const subTree = instance.render()
  // vnode 树 -> patch
  // vnode -> element -> mountElement
  patch(subTree, container)
}
