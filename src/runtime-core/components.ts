import { shallowReadonly } from '../reactivity/reactive'
import { initProps } from './componenetProps'
import { emit } from './componentEmit'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'

export function createComponentInstance(vnode) {
  const component = { vnode, type: vnode.type, setupState: {}, props: {}, emit: () => {} }
  component.emit = emit.bind(null, component) as any
  console.log(component)
  return component
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props)
  // initSlots()
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  // 拿到setup 返回
  const { setup } = instance.type
  // ctx
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)
  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    })
    handlerSetupResult(instance, setupResult)
  }
}
function handlerSetupResult(instance, setupResult: any) {
  // function-> render Object
  // TODO function
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult
  }

  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type
  instance.render = Component.render
}
