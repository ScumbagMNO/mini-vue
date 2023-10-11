import { getCurrentInstance } from './components'

export function provide(key, value) {
  // 存
  // where to store
  const currentInstance: any = getCurrentInstance()
  if (currentInstance) {
    let { provides } = currentInstance
    const parentProvides = currentInstance.parent.provides
    // 改写了原型链 只初始化一次init
    if (provides === parentProvides) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    provides[key] = value
  }
}

export function inject(key, defaultValue) {
  // 取
  const currentInstance: any = getCurrentInstance()
  if (currentInstance) {
    const { parent } = currentInstance
    const parentProvides = parent.provides

    if (key in parentProvides) {
      return parentProvides[key]
    } else if (defaultValue) {
      if (typeof defaultValue === 'function') {
        return defaultValue()
      }
      return defaultValue
    }
  }
}
