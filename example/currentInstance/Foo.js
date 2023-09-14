import { h, getCurrentInstance } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  setup() {
    const instance = getCurrentInstance()
    console.log('Foo:', instance)
    return {}
  },
  render() {
    const foo = h('div', {}, 'foo')
    return foo
  },
}
