import { extend } from '../shared'

const targetMap = new Map()
let activeEffect
let shouldTrack = true

export class ReactiveEffect {
  private _fn: any
  deps = []
  active = true
  public scheduler: Function | undefined
  public onStop?: () => void
  constructor(fn, scheduler?: Function) {
    this._fn = fn
    this.scheduler = scheduler
  }
  run() {
    activeEffect = this
    if (!this.active) return this._fn()

    // shouldTrack 来做区分
    shouldTrack = true
    const result = this._fn()
    // reset 使其只在active时主动收集此effect
    shouldTrack = false

    return result
  }
  stop() {
    if (this.active) {
      cleanupEffect(this)
      if (this.onStop) this.onStop()
      this.active = false
    }
  }
}

function cleanupEffect(effect: any) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect)
  })
  effect.deps.length = 0
}

export function track(target, key) {
  if (!isTracking()) return
  // target -> key -> dep
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  trackEffects(dep)
}

export function trackEffects(dep) {
  // 已经在dep中 不需要再度添加
  if (dep.has(activeEffect)) return
  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined
}

export function trggier(target, key) {
  let depsMap = targetMap.get(target)
  let dep = depsMap.get(key)
  triggerEffects(dep)
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler()
    } else effect.run()
  }
}

export function effect(fn, options: any = {}) {
  // fn
  const _effect = new ReactiveEffect(fn, options.scheduler)
  // _effect.onStop = options.onStop
  // Object.assign(_effect,options)
  // options extend
  extend(_effect, options)
  _effect.run()
  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

export function stop(runner) {
  runner.effect.stop()
}
