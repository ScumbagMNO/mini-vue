import { ref, h } from '../../lib/guide-mini-vue.esm.js'
const nextChildren = [h('div', {}, 'C'), h('div', {}, 'D'), h('div', {}, 'C')]
const prevChildren = [h('div', {}, 'A'), h('div', {}, 'B'), h('div', {}, 'C')]

export default {
  name: 'ArrayToText',
  setup() {
    const isChange = ref(false)
    window.isChange = isChange
    return {
      isChange,
    }
  },
  render() {
    const self = this
    return self.isChange ? h('div', {}, nextChildren) : h('div', {}, prevChildren)
  },
}
