import { extend, isObject } from '../shared/index'
import { track, trggier } from './effect'
import { ReactiveFlags, reactive, readonly } from './reactive'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    // {foo:1} return foo
    // console.log(key)
    if (key === ReactiveFlags.IS_REACTIVE) return !isReadonly
    else if (key === ReactiveFlags.IS_READONLY) return isReadonly
    const res = Reflect.get(target, key)

    if (shallow) return res

    if (isObject(res)) return isReadonly ? readonly(res) : reactive(res)

    // 只读的话，不能set也就不会触发effect.run没必要收集
    if (!isReadonly) track(target, key)

    return res
  }
}

function createSetter() {
  return function set(target, key, val) {
    const res = Reflect.set(target, key, val)
    //  触发依赖
    trggier(target, key)
    return res
  }
}
export const mutalbleHandlers = {
  get,
  set,
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    // throw
    console.warn(`key:${key} set faile because target is`)
    return true
  },
}

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
})
