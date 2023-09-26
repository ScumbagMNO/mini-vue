import { ref, h } from '../../lib/guide-mini-vue.esm.js'
import { Child } from './Child.js'
window.self = null
export const App = {
  name: 'App',
  render() {
    return h('div', {}, [
      h('div', {}, '你好'),
      h('button', { onClick: this.changeChildProps }, 'change child props'),
      h(Child, { msg: this.msg }),
      h('button', { onClick: this.add }, 'add'),
      h('p', {}, 'count: ' + this.count)
    ])
  },

  setup() {
    // composition api
    const msg = ref(123)
    const count = ref(1)
    // window.msg = msg
    const changeChildProps = () => {
      msg.value = 789
    }
    const add = () => {
      count.value++
    }
    return { msg, count, changeChildProps, add }
  }
}
