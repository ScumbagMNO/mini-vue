import { isObject } from '../shared/index'
import { mutalbleHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers'

export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
}

export function reactive(raw) {
  return createActiveObject(raw, mutalbleHandlers)
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers)
}

export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers)
}

function createActiveObject(target: any, baseHandlers) {
  if (!isObject(target)) {
    console.warn(`target ${target} must be a object`)

    return
  }
  return new Proxy(target, baseHandlers)
}

export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY]
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value)
}
