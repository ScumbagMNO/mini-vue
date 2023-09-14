import { ShapeFlags } from '../shared/ShapeFlags'
import { isObject } from '../shared/index'
import { createComponentInstance, setupComponent } from './components'
import { Fragment, Text } from './vnode'

/* 
整体流程 
逻辑为递归渲染 虚拟节点 
如果为component 会先将其做一定处理后转为element
为element 虚拟结点后会递归渲染

vnode 有 component element Fragment Text 的类型 二者对于props和children的处理不同
compoonent props 由父组件传进来的数据，或函数（一般用于接受emit 为 on+Event 命名）
compoonent children 可以为vnode结点或数组  可以为对象
为对象时为slot 此时需要 将父组件传入的slot为 虚拟节点储存在componentVnode的 $slots中以便组件渲染时使用
顺序为 执行 子组件的 component挂载过程

element props 主要是 html 标签的 attr 和各类click mouseEnter等监听捕获事件
element children 主要是 vnode结点或vnode数组

Fragment 是不会渲染自身 然后将children挂载到其父节点上

Text 是渲染成 TextNode而非 html标签Node


*/

export function render(vnode, container) {
  // patch 处理 传进来的vnode 和 将其挂载的父节点
  patch(vnode, container)
}

function patch(vnode, container) {
  //  如何区分是element还是 component类型
  // console.log(vnode.type)
  const { type, shapeFlag } = vnode
  // Fragment -> 只渲染 children
  switch (type) {
    case Fragment:
      processFragement(vnode, container)
      break
    case Text:
      processText(vnode, container)
      break
    default:
      if (shapeFlag & ShapeFlags.ElEMENT) {
        processElement(vnode, container)
        // STATEFUL_COMPONENT
      }
      // 处理组件
      // 判断是不是Element
      else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container)
      }
      break
  }
}

function processFragement(vnode: any, container: any) {
  mountChildren(vnode, container)
}

function processText(vnode: any, container: any) {
  const { children } = vnode
  const textNode = (vnode.el = document.createTextNode(children))
  container.append(textNode)
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
  const { children, shapeFlag } = vnode
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // text_children
    el.textContent = children
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    //  array_children
    mountChildren(vnode, el)
  }

  // props
  const { props } = vnode
  for (const key in props) {
    const val = props[key]
    // console.log(key)
    // 具体的click
    // 规范 on + Event name
    const isOn = (key: string) => /^on[A-Z]/.test(key)

    if (isOn(key)) {
      const event = key.slice(2).toLocaleLowerCase()
      el.addEventListener(event, val)
    } else el.setAttribute(key, val)
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
  // vnode subTree -> patch
  // vnode -> element -> mountElement
  patch(subTree, container)

  // 结束了此组件所有element -> mount
  // 此时的vode是component上的vnode subTree是处理过的element所变为的vnode
  initialVnode.el = subTree.el
}
