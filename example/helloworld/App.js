import { h } from '../../lib/guide-mini-vue.esm.js'
export const App = {
  // .vue
  // <template></template> 暂时无法 必须有render
  // render
  render() {
    return h('div', 'hi ,' + this.msg)
  },

  setup() {
    // composition api
    return {
      msg: 'mini-vue',
    }
  },
}
