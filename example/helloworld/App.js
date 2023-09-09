import { h } from '../../lib/guide-mini-vue.esm.js'

window.self = null

export const App = {
  // .vue
  // <template></template> 暂时无法 必须有render
  // render
  render() {
    window.self = this
    return h(
      'div',
      {
        id: 'root',
        class: ['red', 'hard'],
      },
      // 'hi , mini-vue'
      // Array
      [h('p', { class: ['red'] }, 'hi'), h('p', { class: ['blue'] }, this.msg)]
    )
  },

  setup() {
    // composition api
    return {
      msg: 'mini-vue haha',
    }
  },
}
