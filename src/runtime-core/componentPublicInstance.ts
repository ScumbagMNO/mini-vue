import { hasOwn } from '../shared'

const publicPropertiesMap = {
  $el: i => i.vnode.el,
  $slots: i => i.slots,
  $props: i => i.props
}

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    // TODO

    // 从setupstate获取值
    const { setupState, props } = instance

    // 从哪拿值
    if (hasOwn(setupState, key)) {
      return setupState[key]
    } else if (hasOwn(props, key)) {
      return props[key]
    }

    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  }
}
