import { ShapeFlags } from '../shared/ShapeFlags'

export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
    el: null,
  }
  if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }
  return vnode
}

function getShapeFlag(type) {
  return typeof type === 'string' ? ShapeFlags.ElEMENT : ShapeFlags.STATEFUL_COMPONENT
}
