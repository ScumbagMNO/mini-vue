import { hasChanged, isObject } from '../shared'
import { isTracking, trackEffects, triggerEffects } from './effect'
import { reactive } from './reactive'

// 一般为单值 1 ture "1"
// 何时get set，无法复用proxy
// 模仿proxy思想 {} -> get set

class RefImpl {
  private _value: any
  public dep
  private _rawValue: any
  public __v_isRef = true
  constructor(value) {
    // 原生值
    this._rawValue = value
    // 看看value是不是 对象
    this._value = convert(value)

    this.dep = new Set()
  }
  get value() {
    trackRefValue(this)

    return this._value
  }
  set value(newVal) {
    // 修改value值后通知
    // hasChanged
    if (hasChanged(this._rawValue, newVal)) {
      this._rawValue = newVal
      this._value = convert(newVal)
      triggerEffects(this.dep)
    }
  }
}

export const ref = function (value) {
  return new RefImpl(value)
}

function trackRefValue(ref) {
  if (isTracking()) trackEffects(ref.dep)
}

function convert(value) {
  return isObject(value) ? reactive(value) : value
}

export const isRef = function (ref) {
  return !!ref.__v_isRef
}
export const unRef = function (ref) {
  // 看看是否为ref对象  返回ref.value
  // ref
  return isRef(ref) ? ref.value : ref
}

export const proxyRefs = function (objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      //  get -> gae(ref) return .value
      // not ref  return value
      return unRef(Reflect.get(target, key))
    },
    set(target, key, val) {
      // set -> ref .value
      // 不是ref的时候 直接设置ref value
      if (isRef(target[key]) && !isRef(val)) {
        return (target[key].value = val)
      } else {
        // 是ref 但替换值也是ref 需要替换 不是ref 也不是ref新值 也是直接替换
        return Reflect.set(target, key, val)
      }
    },
  })
}
