import { h, provide, inject } from '../../lib/guide-mini-vue.esm.js'

const Provider = {
  name: 'Provider',
  setup() {
    provide('foo', 'fooVal')
    provide('bar', 'barVal')
  },
  render() {
    return h('div', {}, [h('p', {}, 'provider'), h(Provider2)])
  },
}

const Provider2 = {
  name: 'Provider',
  setup() {
    provide('foo', 'fooVal2')
    const foo = inject('foo')
    return { foo }
  },
  render() {
    return h('div', {}, [h('p', {}, 'provider2: ' + this.foo), h(Consumer)])
  },
}

const Consumer = {
  name: 'Consumer',
  setup() {
    const foo = inject('foo')
    const bar = inject('bar')
    const baz = inject('baz', () => 'default baz')
    return {
      foo,
      bar,
      baz,
    }
  },
  render() {
    return h('div', {}, `Consumer - ${this.foo} - ${this.bar} - ${this.baz}`)
  },
}

export const App = {
  name: 'App',
  // .vue
  // <template></template> 暂时无法 必须有render
  // render
  render() {
    return h('div', {}, [h('p', {}, 'apiInject'), h(Provider)])
  },

  setup() {},
}
