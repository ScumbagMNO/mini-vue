import { isObject } from '../shared/index'
import { createComponentInstance, setupComponent } from './components'

export function render(vnode, container) {
  // patch
  patch(vnode, container)
}

function patch(vnode, container) {
  // TODO vnode 判断是不是element
  //  如何区分是element还是 component类型
  console.log(vnode.type)
  if (typeof vnode.type === 'string') {
    processElement(vnode, container)
  }
  // 处理组件
  // 判断是不是Element
  else if (isObject(vnode.type)) {
    processComponent(vnode, container)
  }
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container)
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}

function mountElement(vnode: any, container: any) {
  const el = (vnode.el = document.createElement(vnode.type))
  //  string  array
  const { children } = vnode
  if (typeof children === 'string') {
    el.textContent = children
  } else if (Array.isArray(children) && children.length !== 0) {
    mountChildren(vnode, el)
  }

  // props
  const { props } = vnode
  for (const key in props) {
    const val = props[key]
    el.setAttribute(key, val)
  }

  container.append(el)
}

function mountChildren(vnode, container) {
  vnode.children.forEach((v) => {
    patch(v, container)
  })
}

function mountComponent(initialVnode: any, container) {
  // 创建组件实例
  const instance = createComponentInstance(initialVnode)

  setupComponent(instance)

  setupRenderEffect(instance, initialVnode, container)
}

function setupRenderEffect(instance: any, initialVnode, container) {
  const { proxy } = instance
  const subTree = instance.render.call(proxy)
  // vnode 树 -> patch
  // vnode -> element -> mountElement
  patch(subTree, container)
  // 结束了此组件所有element -> mount

  // 此时的vode是component上的vnode subTree是处理过的element所vnode
  initialVnode.el = subTree.el
}
