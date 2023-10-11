import { initProps } from './componentProps'
import { emit } from './componentEmit'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentSlots'
import { proxyRefs, shallowReadonly } from '@guide-mini-vue/reactivity'

export function createComponentInstance(vnode, parent) {
  // console.log('createComponentInstance ', parent)
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    next: null,
    subTree: {},
    isMounted: false,
    emit: () => {}
  }
  component.emit = emit.bind(null, component) as any
  return component
}

export function setupComponent(instance) {
  // console.log(instance)

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
    // 把传入的props传入setup
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit
    })
    setCurrentInstance(null)

    handlerSetupResult(instance, setupResult)
  }
}
function handlerSetupResult(instance, setupResult: any) {
  // function-> render Object
  // TODO function
  if (typeof setupResult === 'object') {
    instance.setupState = proxyRefs(setupResult)
  }

  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type

  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template)
    }
  }
  // template
  instance.render = Component.render
}

let currentInstance = null

export function getCurrentInstance() {
  return currentInstance
}

export function setCurrentInstance(instance: any) {
  currentInstance = instance
}

let compiler

export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler
}
