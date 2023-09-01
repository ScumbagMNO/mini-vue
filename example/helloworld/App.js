import { h } from '../../lib/guide-mini-vue.esm.js'
export const App = {
  // .vue
  // <template></template> 暂时无法 必须有render
  // render
  render() {
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
      },
      // 'hi ,' + this.msg
      // 'hi , mini-vue'
      // Array
      [h('p', { class: ['red'] }, 'hi'), h('p', { class: ['blue'] }, 'mini-vue')]
    )
  },

  setup() {
    // composition api
    return {
      msg: 'mini-vue',
    }
  },
}
