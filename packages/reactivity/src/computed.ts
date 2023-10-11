import { ReactiveEffect } from './effect'

class ComputedRefImpl {
  private _getter: any
  private _dirty: boolean = true
  private _value: any
  private _effect: any
  constructor(getter) {
    this._getter = getter
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) this._dirty = true
    })
  }
  get value() {
    // get 一次后锁上
    // value发生改变 -> dirty true
    // 依赖响应式对象值发生改变的时候
    // effect 实现
    if (this._dirty) {
      this._dirty = false
      this._value = this._effect.run()
    }
    return this._value
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter)
}
