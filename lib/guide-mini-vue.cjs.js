'use strict';

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 组件 + children object
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ElEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = (value) => {
    return typeof value === 'object' && value !== null;
};
const hasChanged = (val, newVal) => {
    return !Object.is(val, newVal);
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
let activeEffect;
let shouldTrack = true;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.active = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        activeEffect = this;
        if (!this.active)
            return this._fn();
        // shouldTrack 来做区分
        shouldTrack = true;
        const result = this._fn();
        // reset 使其只在active时主动收集此effect
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop)
                this.onStop();
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
function track(target, key) {
    if (!isTracking())
        return;
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    // 已经在dep中 不需要再度添加
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
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
function effect(fn, options = {}) {
    // fn
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // _effect.onStop = options.onStop
    // Object.assign(_effect,options)
    // options extend
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
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
        // 只读的话，不能set也就不会触发effect.run没必要收集
        if (!isReadonly)
            track(target, key);
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
// 更新场景 foo值和之前不一样 修该
//  null || undefined 删除
// bar 这个属性在新的里面没有了删除

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
    $el: i => i.vnode.el,
    $slots: i => i.slots,
    $props: i => i.props
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // TODO
        // 从setupstate获取值
        const { setupState, props } = instance;
        // 从哪拿值
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
    }
};

function initSlots(instance, children) {
    // children object
    // instance.slots = Array.isArray(children) ? children : [children]
    // slots
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // slot
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

// 一般为单值 1 ture "1"
// 何时get set，无法复用proxy
// 模仿proxy思想 {} -> get set
class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        // 原生值
        this._rawValue = value;
        // 看看value是不是 对象
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newVal) {
        // 修改value值后通知
        // hasChanged
        if (hasChanged(this._rawValue, newVal)) {
            this._rawValue = newVal;
            this._value = convert(newVal);
            triggerEffects(this.dep);
        }
    }
}
const ref = function (value) {
    return new RefImpl(value);
};
function trackRefValue(ref) {
    if (isTracking())
        trackEffects(ref.dep);
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
const isRef = function (ref) {
    return !!ref.__v_isRef;
};
const unRef = function (ref) {
    // 看看是否为ref对象  返回ref.value
    // ref
    return isRef(ref) ? ref.value : ref;
};
const proxyRefs = function (objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            //  get -> gae(ref) return .value
            // not ref  return value
            return unRef(Reflect.get(target, key));
        },
        set(target, key, val) {
            // set -> ref .value
            // 不是ref的时候 直接设置ref value
            if (isRef(target[key]) && !isRef(val)) {
                return (target[key].value = val);
            }
            else {
                // 是ref 但替换值也是ref 需要替换 不是ref 也不是ref新值 也是直接替换
                return Reflect.set(target, key, val);
            }
        },
    });
};

function createComponentInstance(vnode, parent) {
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
        emit: () => { }
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // console.log(instance)
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 拿到setup 返回
    const { setup } = instance.type;
    // ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    if (setup) {
        setCurrentInstance(instance);
        // 把传入的props传入setup
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        setCurrentInstance(null);
        handlerSetupResult(instance, setupResult);
    }
}
function handlerSetupResult(instance, setupResult) {
    // function-> render Object
    // TODO function
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    // 存
    // where to store
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 改写了原型链 只初始化一次init
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const { parent } = currentInstance;
        const parentProvides = parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function shouldUpdateComponent(preVNode, nextVNode) {
    const { props: preProps } = preVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== preProps[key])
            return true;
    }
    return false;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先转化成vnode
                //  component -> vode
                // 所有逻辑操作 都会基于 vnode 处理
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

/*
整体流程
逻辑为递归渲染 虚拟节点
如果为component 会先将其做一定处理后转为element
为element 虚拟结点后会递归渲染

vnode 有 component element Fragment Text 的类型 二者对于props和children的处理不同
component props 由父组件传进来的数据，或函数（一般用于接受emit 为 on+Event 命名）
compoonent children 可以为vnode结点或数组  可以为对象
为对象时为slot 此时需要 将父组件传入的slot为 虚拟节点储存在componentVnode的 $slots中以便组件渲染时使用
顺序为 执行 子组件的 component挂载过程

element props 主要是 html 标签的 attr 和各类click mouseEnter等监听捕获事件
element children 主要是 vnode结点或vnode数组

Fragment 是不会渲染自身 然后将children挂载到其父节点上

Text 是渲染成 TextNode而非 html标签Node


*/
function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        // patch 处理 传进来的vnode 和 将其挂载的父节点
        patch(null, vnode, container, null, null);
    }
    // n1为旧的虚拟节点  n2为新的虚拟节点
    function patch(n1, n2, container, parentComponent, anchor) {
        //  如何区分是element还是 component类型
        // console.log(vnode.type)
        const { type, shapeFlag } = n2;
        // Fragment -> 只渲染 children
        switch (type) {
            case Fragment:
                processFragement(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ElEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                    // STATEFUL_COMPONENT
                }
                // 处理组件
                // 判断是不是Element
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processFragement(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        // console.log('patchElement---')
        // console.log('n1', n1)
        // console.log('n2', n2)
        // 需对比新旧结点的props 和 children
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1;
        const { shapeFlag: nextShapeFlag, children: c2 } = n2;
        // 新的children为文本
        if (nextShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 1.把老的children清空
                unmountChildren(n1.children);
            }
            // 2.设置为新的 text
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            //  新的children为数组
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0;
        const l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        // 左侧指针
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        console.log('i:', i);
        // 右侧指针
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        if (i > e1) {
            // 新的比老的多
            if (i <= e2) {
                const nextPos = e2 + 1;
                // 判断是左侧添加还是右侧添加
                const anchor = nextPos + 1 < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 新的比老的少
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 此处求出中间乱序部分
            //   i<e1 i <e2
            let s1 = i;
            let s2 = i;
            // 记录新的结点总数
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            // 建立key映射表
            const keyToNewIndexMap = new Map();
            const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
            let moved = false;
            let maxNewIndexSoFar = 0;
            // for (let i = 0; i < toBePatched; i++) {
            //   newIndexToOldIndexMap[i] = 0
            // }
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 对旧的和新的乱序部分 进行遍历
            // 对旧的进行遍历 是为了找出旧的在新的中是否存在 不存在则删除 存在则更新
            // key的存在意义主要是为了更快的找到新的位置
            for (let i = s1; i <= e1; i++) {
                const preChild = c1[i];
                let newIndex;
                if (patched >= toBePatched) {
                    hostRemove(preChild);
                    continue;
                }
                //下面找出旧节点是否在新节点列表中存在吗
                if (preChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(preChild.key);
                }
                else {
                    // 旧节点无key的情况下
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(preChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(preChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 老的在新的仍然存在 此处只做了更新没有做移动 并且记录其在旧序列中的索引
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(preChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 获取在新的序序中 旧的对应最长递增子序列
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            //对新的序列中间乱序部分进行遍历
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                        console.log('移动位置');
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function isSomeVNodeType(n1, n2) {
        // type
        // key
        // console.log(n1, n2)
        return n1.type === n2.type && n1.key === n2.key;
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 遍历新的 更新props
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                // 遍历旧的 删除已去除的
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        // TODO 适配化
        const el = (vnode.el = hostCreateElement(vnode.type));
        //  string  array
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // text_children
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            //  array_children
            mountChildren(vnode.children, el, parentComponent, null);
        }
        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        // container.append(el)
        // anchor如果是初次加载都为 null
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(v => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        // 创建组件实例
        const instance = (initialVnode.component = createComponentInstance(initialVnode, parentComponent));
        // 挂载setupState props $slots emit $el等
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        instance.update = effect(() => {
            // patch上会取到 setupState上的值因此会监听触发effect
            if (!instance.isMounted) {
                const { proxy } = instance;
                // 此时出来的是element节点
                const subTree = (instance.subTree = instance.render.call(proxy));
                // vnode subTree -> patch
                // vnode -> element -> mountElement
                patch(null, subTree, container, instance, anchor);
                // 结束了此组件所有element -> mount
                // 此时的vode是component上的vnode subTree是处理过的element所变为的vnode
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('update');
                // 需要一个 vnode
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                // vnode subTree -> patch
                // vnode -> element -> mountElement
                patch(prevSubTree, subTree, container, instance, anchor);
                // 结束了此组件所有element -> mount
                // 此时的vnode是component上的vnode subTree是处理过的element所变为的vnode
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
function getSequence(arr) {
    // 复制一份arr
    const p = arr.slice();
    const result = [0];
    // i: 当前遍历的索引 j: result最后一个值的索引 u: 二分查找的起始索引 v: 二分查找的结束索引 c: 二分查找的中间索引
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        // 二分查找 arr[result[j]] < arr[i]  找到第一个大于arr[i]的值
        const arrI = arr[i];
        if (arrI !== 0) {
            // result最后一个值的索引
            j = result[result.length - 1];
            // 如果arr[j] < arr[i] 直接插入到result的最后
            console.log(arr[j], arrI);
            if (arr[j] < arrI) {
                // 获取最后一个值的索引
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            // 遍历result
            while (u < v) {
                // 二分查找
                c = (u + v) >> 1;
                // 如果arr[result[c]] < arr[i] 说明arr[i]的值在result[c]的右边
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevValue, nextValue) {
    // 规范 on + Event name
    // console.log(key)
    // 具体的click
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, nextValue);
    }
    else {
        if (nextValue === undefined || nextValue === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function insert(child, parent, anchor) {
    // anchor 为dom元素
    // parent.append(el)
    // console.log('child, parent, anchor: ', child, parent, anchor)
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
