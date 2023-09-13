'use strict';

const extend = Object.assign;
const isObject = (value) => {
    return typeof value === 'object' && value !== null;
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const toHandlerKey = (str) => (str ? 'on' + capitalize(str) : '');

const targetMap = new Map();
function trggier(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else
            effect.run();
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        // {foo:1} return foo
        // console.log(key)
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */)
            return !isReadonly;
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */)
            return isReadonly;
        const res = Reflect.get(target, key);
        if (shallow)
            return res;
        if (isObject(res))
            return isReadonly ? readonly(res) : reactive(res);
        return res;
    };
}
function createSetter() {
    return function set(target, key, val) {
        const res = Reflect.set(target, key, val);
        //  触发依赖
        trggier(target, key);
        return res;
    };
}
const mutalbleHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        // throw
        console.warn(`key:${key} set faile because target is readOnly`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    return createActiveObject(raw, mutalbleHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function createActiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} must be a object`);
        return;
    }
    return new Proxy(target, baseHandlers);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
    // attrs
}

function emit(instance, event, ...args) {
    console.log('emit', event);
    // instance.props -> event
    const { props } = instance;
    // TPP
    // 先写一个特定的行为 -》 重构成通用
    // add -> Add 转换
    // add-foo -> addFoo
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // TODO
        // 从setupstate获取值
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode) {
    const component = { vnode, type: vnode.type, setupState: {}, props: {}, emit: () => { } };
    component.emit = emit.bind(null, component);
    console.log(component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 拿到setup 返回
    const { setup } = instance.type;
    // ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
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
    patch(vnode, container);
}
function patch(vnode, container) {
    // ShapeFlags
    // TODO vnode 判断是不是element
    //  如何区分是element还是 component类型
    // console.log(vnode.type)
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ShapeFlags.ElEMENT */) {
        processElement(vnode, container);
        // STATEFUL_COMPONENT
    }
    // 处理组件
    // 判断是不是Element
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type));
    //  string  array
    const { children, shapeFlag } = vnode;
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        // text_children
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        //  array_children
        mountChildren(vnode, el);
    }
    // props
    const { props } = vnode;
    for (const key in props) {
        const val = props[key];
        // console.log(key)
        // 具体的click
        // 规范 on + Event name
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const event = key.slice(2).toLocaleLowerCase();
            el.addEventListener(event, val);
        }
        else
            el.setAttribute(key, val);
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
function mountComponent(initialVnode, container) {
    // 创建组件实例
    const instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode subTree -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
    // 结束了此组件所有element -> mount
    // 此时的vode是component上的vnode subTree是处理过的element所变为的vnode
    initialVnode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ElEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先转化成vnode
            //  component -> vode
            // 所有逻辑操作 都会基于 vnode 处理
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
