import { h, renderSlots } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  setup(props, { emit }) {},
  render() {
    const foo = h('p', {}, 'foo')
    console.log('slots', this.$slots)
    // renderSlots 具名插槽
    // 1. 获取到要渲染的元素
    // 2、要获取到渲染的位置
    const age = 18 // 作用域插槽
    return h('p', {}, [renderSlots(this.$slots, 'header', { age }), foo, renderSlots(this.$slots, 'footer')])
  },
}
