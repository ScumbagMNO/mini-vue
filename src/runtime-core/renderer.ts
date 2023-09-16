import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './components'
import { createAppAPI } from './createApp'
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
export function createRenderer(options) {
  const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options
  function render(vnode, container) {
    // patch 处理 传进来的vnode 和 将其挂载的父节点
    patch(vnode, container, null)
  }

  function patch(vnode, container, parentComponent) {
    //  如何区分是element还是 component类型
    // console.log(vnode.type)
    const { type, shapeFlag } = vnode
    // Fragment -> 只渲染 children
    switch (type) {
      case Fragment:
        processFragement(vnode, container, parentComponent)
        break
      case Text:
        processText(vnode, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ElEMENT) {
          processElement(vnode, container, parentComponent)
          // STATEFUL_COMPONENT
        }
        // 处理组件
        // 判断是不是Element
        else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent)
        }
        break
    }
  }

  function processFragement(vnode: any, container: any, parentComponent) {
    mountChildren(vnode, container, parentComponent)
  }

  function processText(vnode: any, container: any) {
    const { children } = vnode
    const textNode = (vnode.el = document.createTextNode(children))
    container.append(textNode)
  }

  function processElement(vnode: any, container: any, parentComponent) {
    mountElement(vnode, container, parentComponent)
  }

  function processComponent(vnode: any, container: any, parentComponent) {
    mountComponent(vnode, container, parentComponent)
  }

  function mountElement(vnode: any, container: any, parentComponent) {
    // TODO 适配化
    const el = (vnode.el = hostCreateElement(vnode.type))
    //  string  array
    const { children, shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // text_children
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //  array_children
      mountChildren(vnode, el, parentComponent)
    }

    // props
    const { props } = vnode
    for (const key in props) {
      const val = props[key]
      // console.log(key)
      // 具体的click

      hostPatchProp(el, key, val)
    }
    // container.append(el)
    hostInsert(el, container)
  }

  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
      patch(v, container, parentComponent)
    })
  }

  function mountComponent(initialVnode: any, container, parentComponent) {
    // 创建组件实例
    const instance = createComponentInstance(initialVnode, parentComponent)

    setupComponent(instance)

    setupRenderEffect(instance, initialVnode, container)
  }

  function setupRenderEffect(instance: any, initialVnode, container) {
    const { proxy } = instance
    const subTree = instance.render.call(proxy)
    // vnode subTree -> patch
    // vnode -> element -> mountElement
    patch(subTree, container, instance)

    // 结束了此组件所有element -> mount
    // 此时的vode是component上的vnode subTree是处理过的element所变为的vnode
    initialVnode.el = subTree.el
  }

  return {
    createApp: createAppAPI(render),
  }
}
