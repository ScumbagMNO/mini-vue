import { h } from '../../dist/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'
window.self = null

export const App = {
  name: 'App',
  // .vue
  // <template></template> 暂时无法 必须有render
  // render
  render() {
    window.self = this
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard']
        // onClick() {
        //   console.log('click')
        // },
        // onMouseEnter() {
        //   console.log('onMouseEnter')
        // },
      },
      [h('div', {}, 'hi' + this.msg), h(Foo, { count: 2 })]
      // 'hi , mini-vue'
      // Array
      // [h('p', { class: ['red'] }, 'hi'), h('p', { class: ['blue'] }, this.msg)]
    )
  },

  setup() {
    // composition api
    return {
      msg: 'mini-vue haha'
    }
  }
}
