import { effect } from '../reactivity/effect'
import { EMPTY_OBJ } from '../shared'
import { ShapeFlags } from '../shared/ShapeFlags'
import { shouldUpdateComponent } from './componentUpdateUtils'
import { createComponentInstance, setupComponent } from './components'
import { createAppAPI } from './createApp'
import { Fragment, Text } from './vnode'

/* 
整体流程 
逻辑为递归渲染 虚拟节点 
如果为component 会先将其做一定处理后转为element
为element 虚拟结点后会递归渲染

vnode 有 component element Fragment Text 的类型 二者对于props和children的处理不同
component props 由父组件传进来的数据，或函数（一般用于接受emit 为 on+Event 命名）
compoonent children 可以为vnode结点或数组  可以为对象
为对象时为slot 此时需要 将父组件传入的slot为 虚拟节点储存在componentVnode的 $slots中以便组件渲染时使用
顺序为 执行 子组件的 component挂载过程

element props 主要是 html 标签的 attr 和各类click mouseEnter等监听捕获事件
element children 主要是 vnode结点或vnode数组

Fragment 是不会渲染自身 然后将children挂载到其父节点上

Text 是渲染成 TextNode而非 html标签Node


*/
export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options
  function render(vnode, container) {
    // patch 处理 传进来的vnode 和 将其挂载的父节点
    patch(null, vnode, container, null, null)
  }

  // n1为旧的虚拟节点  n2为新的虚拟节点
  function patch(n1, n2, container, parentComponent, anchor) {
    //  如何区分是element还是 component类型
    // console.log(vnode.type)
    const { type, shapeFlag } = n2
    // Fragment -> 只渲染 children
    switch (type) {
      case Fragment:
        processFragement(n1, n2, container, parentComponent, anchor)
        break
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ElEMENT) {
          processElement(n1, n2, container, parentComponent, anchor)
          // STATEFUL_COMPONENT
        }
        // 处理组件
        // 判断是不是Element
        else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor)
        }
        break
    }
  }

  function processFragement(n1, n2: any, container: any, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor)
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2
    const textNode = (n2.el = document.createTextNode(children))
    container.append(textNode)
  }

  function processElement(n1, n2: any, container: any, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor)
    } else {
      patchElement(n1, n2, container, parentComponent, anchor)
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    // console.log('patchElement---')
    // console.log('n1', n1)
    // console.log('n2', n2)
    // 需对比新旧结点的props 和 children

    const oldProps = n1.props || EMPTY_OBJ
    const newProps = n2.props || EMPTY_OBJ

    const el = (n2.el = n1.el)

    patchChildren(n1, n2, el, parentComponent, anchor)
    patchProps(el, oldProps, newProps)
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1
    const { shapeFlag: nextShapeFlag, children: c2 } = n2
    // 新的children为文本
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1.把老的children清空
        unmountChildren(n1.children)
      }
      // 2.设置为新的 text
      if (c1 !== c2) {
        hostSetElementText(container, c2)
      }
    } else {
      //  新的children为数组
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '')
        mountChildren(c2, container, parentComponent, anchor)
      } else {
        patchKeyedChildren(c1, c2, container, parentComponent, anchor)
      }
    }
  }

  function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
    let i = 0
    const l2 = c2.length
    let e1 = c1.length - 1
    let e2 = l2 - 1

    // 左侧指针
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }
      i++
    }
    console.log('i:', i)

    // 右侧指针
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSomeVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor)
      } else {
        break
      }
      e1--
      e2--
    }
    if (i > e1) {
      // 新的比老的多
      if (i <= e2) {
        const nextPos = e2 + 1
        // 判断是左侧添加还是右侧添加
        const anchor = nextPos + 1 < l2 ? c2[nextPos].el : null
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // 新的比老的少
      while (i <= e1) {
        hostRemove(c1[i].el)
        i++
      }
    } else {
      // 此处求出中间乱序部分
      //   i<e1 i <e2
      let s1 = i
      let s2 = i
      // 记录新的结点总数
      const toBePatched = e2 - s2 + 1
      let patched = 0
      // 建立key映射表
      const keyToNewIndexMap = new Map()
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0)
      let moved = false
      let maxNewIndexSoFar = 0

      // for (let i = 0; i < toBePatched; i++) {
      //   newIndexToOldIndexMap[i] = 0
      // }

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        keyToNewIndexMap.set(nextChild.key, i)
      }

      // 对旧的和新的乱序部分 进行遍历
      // 对旧的进行遍历 是为了找出旧的在新的中是否存在 不存在则删除 存在则更新
      // key的存在意义主要是为了更快的找到新的位置
      for (let i = s1; i <= e1; i++) {
        const preChild = c1[i]
        let newIndex
        if (patched >= toBePatched) {
          hostRemove(preChild)
          continue
        }
        //下面找出旧节点是否在新节点列表中存在吗
        if (preChild.key !== null) {
          newIndex = keyToNewIndexMap.get(preChild.key)
        } else {
          // 旧节点无key的情况下
          for (let j = s2; j <= e2; j++) {
            if (isSomeVNodeType(preChild, c2[j])) {
              newIndex = j
              break
            }
          }
        }
        if (newIndex === undefined) {
          hostRemove(preChild.el)
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            moved = true
          }
          // 老的在新的仍然存在 此处只做了更新没有做移动 并且记录其在旧序列中的索引
          newIndexToOldIndexMap[newIndex - s2] = i + 1
          patch(preChild, c2[newIndex], container, parentComponent, null)
          patched++
        }
      }

      // 获取在新的序序中 旧的对应最长递增子序列
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []

      //对新的序列中间乱序部分进行遍历
      let j = increasingNewIndexSequence.length - 1
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor)
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor)
            console.log('移动位置')
          } else {
            j--
          }
        }
      }
    }
  }

  function isSomeVNodeType(n1, n2) {
    // type
    // key
    // console.log(n1, n2)
    return n1.type === n2.type && n1.key === n2.key
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

  function processComponent(n1, n2: any, container: any, parentComponent, anchor) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor)
    } else {
      updateComponent(n1, n2)
    }
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component)

    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2
      instance.update()
    } else {
      n2.el = n1.el
      instance.vnode = n2
    }
  }

  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    // TODO 适配化
    const el = (vnode.el = hostCreateElement(vnode.type))
    //  string  array
    const { children, shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // text_children
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //  array_children
      mountChildren(vnode.children, el, parentComponent, null)
    }

    // props
    const { props } = vnode
    for (const key in props) {
      const val = props[key]
      hostPatchProp(el, key, null, val)
    }
    // container.append(el)
    // anchor如果是初次加载都为 null
    hostInsert(el, container, anchor)
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach(v => {
      patch(null, v, container, parentComponent, anchor)
    })
  }

  function mountComponent(initialVnode: any, container, parentComponent, anchor) {
    // 创建组件实例
    const instance = (initialVnode.component = createComponentInstance(
      initialVnode,
      parentComponent
    ))

    // 挂载setupState props $slots emit $el等
    setupComponent(instance)

    setupRenderEffect(instance, initialVnode, container, anchor)
  }

  function setupRenderEffect(instance: any, initialVnode, container, anchor) {
    instance.update = effect(() => {
      // patch上会取到 setupState上的值因此会监听触发effect
      if (!instance.isMounted) {
        const { proxy } = instance

        // 此时出来的是element节点
        const subTree = (instance.subTree = instance.render.call(proxy))
        // vnode subTree -> patch

        // vnode -> element -> mountElement
        patch(null, subTree, container, instance, anchor)
        // 结束了此组件所有element -> mount

        // 此时的vode是component上的vnode subTree是处理过的element所变为的vnode
        initialVnode.el = subTree.el

        instance.isMounted = true
      } else {
        console.log('update')
        // 需要一个 vnode
        const { next, vnode } = instance

        if (next) {
          next.el = vnode.el
          updateComponentPreRender(instance, next)
        }

        const { proxy } = instance
        const subTree = instance.render.call(proxy)
        const prevSubTree = instance.subTree

        instance.subTree = subTree
        // vnode subTree -> patch
        // vnode -> element -> mountElement
        patch(prevSubTree, subTree, container, instance, anchor)
        // 结束了此组件所有element -> mount
        // 此时的vnode是component上的vnode subTree是处理过的element所变为的vnode
        initialVnode.el = subTree.el
        instance.isMounted = true
      }
    })
  }

  return {
    createApp: createAppAPI(render)
  }
}

function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode
  instance.next = null
  instance.props = nextVNode.props
}

function getSequence(arr) {
  // 复制一份arr
  const p = arr.slice()
  const result = [0]
  // i: 当前遍历的索引 j: result最后一个值的索引 u: 二分查找的起始索引 v: 二分查找的结束索引 c: 二分查找的中间索引
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    // 二分查找 arr[result[j]] < arr[i]  找到第一个大于arr[i]的值
    const arrI = arr[i]

    if (arrI !== 0) {
      // result最后一个值的索引
      j = result[result.length - 1]
      // 如果arr[j] < arr[i] 直接插入到result的最后

      console.log(arr[j], arrI)
      if (arr[j] < arrI) {
        // 获取最后一个值的索引
        p[i] = j
        result.push(i)
        continue
      }

      u = 0
      v = result.length - 1

      // 遍历result
      while (u < v) {
        // 二分查找
        c = (u + v) >> 1

        // 如果arr[result[c]] < arr[i] 说明arr[i]的值在result[c]的右边
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }

        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
