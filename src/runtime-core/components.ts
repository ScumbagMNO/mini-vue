import { shallowReadonly } from '../reactivity/reactive'
import { initProps } from './componentProps'
import { emit } from './componentEmit'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentSlots'

export function createComponentInstance(vnode) {
  const component = { vnode, type: vnode.type, setupState: {}, props: {}, slots: {}, emit: () => {} }
  component.emit = emit.bind(null, component) as any
  return component
}

export function setupComponent(instance) {
  initProps(instance, instance.vnode.props)
  initSlots(instance, instance.vnode.children)
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  // 拿到setup 返回
  const { setup } = instance.type
  // ctx
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

  if (setup) {
    setCurrentInstance(instance)
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    })
    setCurrentInstance(null)

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

let currentInstance = null

export function getCurrentInstance() {
  return currentInstance
}

export function setCurrentInstance(instance: any) {
  currentInstance = instance
}
