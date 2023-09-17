import { effect } from '../reactivity/effect'
import { EMPTY_OBJ } from '../shared'
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
  const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options
  function render(vnode, container) {
    // patch 处理 传进来的vnode 和 将其挂载的父节点
    patch(null, vnode, container, null)
  }

  // n1为旧的虚拟节点  n2为新的虚拟节点

  function patch(n1, n2, container, parentComponent) {
    //  如何区分是element还是 component类型
    // console.log(vnode.type)
    const { type, shapeFlag } = n2
    // Fragment -> 只渲染 children
    switch (type) {
      case Fragment:
        processFragement(n1, n2, container, parentComponent)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ElEMENT) {
          processElement(n1, n2, container, parentComponent)
          // STATEFUL_COMPONENT
        }
        // 处理组件
        // 判断是不是Element
        else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent)
        }
        break
    }
  }

  function processFragement(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent)
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children))
    container.append(textNode)
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent)
    } else {
      patchElement(n1, n2, container, parentComponent)
    }
  }

  function patchElement(n1, n2, container, parentComponent) {
    // console.log('patchElement---')
    // console.log('n1', n1)
    // console.log('n2', n2)
    // 需对比新旧结点的props 和 children
    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    const el = (n2.el = n1.el)

    patchChildren(n1, n2, el, parentComponent)
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(n1, n2, container, parentComponent) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1
    const { shapeFlag: nextShapFlag, children: c2 } = n2

    if (nextShapFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1.把老的children清空
        unmountChildren(n1.children)
      }
      // 2.设置为新的 text
      if (c1 !== c2) {
        hostSetElementText(container, c2)
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountChildren(c2, container, parentComponent)
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el
      // remove
      hostRemove(el)
    }
  }

  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      // 遍历新的 更新props
      for (const key in newProps) {
        const prevProp = oldProps[key]
        const nextProp = newProps[key]
        if (prevProp !== nextProp) {
          hostPatchProp(el, key, prevProp, nextProp)
        }
      }
      if (oldProps !== EMPTY_OBJ) {
        // 遍历旧的 删除已去除的
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }

  function processComponent(n1, n2: any, container: any, parentComponent) {
    mountComponent(n2, container, parentComponent)
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
      mountChildren(vnode.children, el, parentComponent)
    }

    // props
    const { props } = vnode
    for (const key in props) {
      const val = props[key]
      hostPatchProp(el, key, null, val)
    }
    // container.append(el)
    hostInsert(el, container)
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent)
    })
  }

  function mountComponent(initialVnode: any, container, parentComponent) {
    // 创建组件实例
    const instance = createComponentInstance(initialVnode, parentComponent)

    setupComponent(instance)

    setupRenderEffect(instance, initialVnode, container)
  }

  function setupRenderEffect(instance: any, initialVnode, container) {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance
        const subTree = (instance.subTree = instance.render.call(proxy))
        // vnode subTree -> patch
        // vnode -> element -> mountElement
        patch(null, subTree, container, instance)

        // 结束了此组件所有element -> mount
        // 此时的vode是component上的vnode subTree是处理过的element所变为的vnode
        initialVnode.el = subTree.el

        instance.isMounted = true
      } else {
        console.log('update')
        const { proxy } = instance

        const subTree = instance.render.call(proxy)
        const prevSubTree = instance.subTree

        instance.subTree = subTree
        // vnode subTree -> patch
        // vnode -> element -> mountElement
        patch(prevSubTree, subTree, container, instance)
        // 结束了此组件所有element -> mount
        // 此时的vode是component上的vnode subTree是处理过的element所变为的vnode
        initialVnode.el = subTree.el

        instance.isMounted = true
      }
    })
  }

  return {
    createApp: createAppAPI(render),
  }
}
