export function createComponentInstance(vnode) {
  const component = { vnode, type: vnode.type }
  return component
}

export function setupComponent(instance) {
  // TODO
  // initProps()
  // initSlots()
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  // 拿到setup 返回
  const { setup } = instance.type
  if (setup) {
    const setupResult = setup()
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
  if (!instance.render) {
    instance.render = Component.render
  }
}
