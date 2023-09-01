function createComponentInstance(vnode) {
    const component = { vnode, type: vnode.type };
    return component;
}
function setupComponent(instance) {
    // TODO
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 拿到setup 返回
    const { setup } = instance.type;
    if (setup) {
        const setupResult = setup();
        handlerSetupResult(instance, setupResult);
    }
}
function handlerSetupResult(instance, setupResult) {
    // function-> render Object
    // TODO function
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}

function render(vnode, container) {
    // patch
    //
    patch(vnode);
}
function patch(vnode, container) {
    // TODO vnode 判断是不是element
    //  如何区分是element还是 component类型
    processRlement();
    // 处理组件
    // 判断是不是Element
    processComponent(vnode);
}
function processComponent(vnode, container) {
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    // 创建组件实例
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    // vnode 树 -> patch
    // vnode -> element -> mountElement
    patch(subTree);
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先转化成vnode
            //  component -> vode
            // 所有逻辑操作 都会基于 vnode 处理
            const vnode = createVNode(rootComponent);
            render(vnode);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
