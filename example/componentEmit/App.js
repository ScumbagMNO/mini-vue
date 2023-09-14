import { h } from '../../lib/guide-mini-vue.esm.js'
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
        class: ['red', 'hard'],
      },
      [
        h('div', {}, 'hi' + this.msg),

        h(Foo, {
          // on + Event
          onAdd(a, b) {
            console.log('onAdd', a, b)
          },
          // add-foo -> AddFoo
          onAddFoo() {
            console.log('onAddFoo')
          },
        }),
      ]
    )
  },

  setup() {
    // composition api
    return {
      msg: 'mini-vue haha',
    }
  },
}
