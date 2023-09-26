import { h, ref, getCurrentInstance, nextTick } from '../../lib/guide-mini-vue.esm.js'
export const App = {
  name: 'App',
  render() {
    const button = h('button', { onClick: this.onClick }, 'click me')
    const p = h('p', {}, 'count: ' + this.count)
    return h('div', {}, [button, p])
  },

  setup() {
    // composition api
    const count = ref(1)
    const instance = getCurrentInstance()
    function onClick() {
      for (let i = 0; i < 100; i++) {
        console.log('update')
        count.value = i
      }
      // 此时instance非最新的，因此需要nextTick
      // console.log(instance)

      nextTick(() => {
        console.log(instance)
      })

      // await nextTick()
      // console.log(instance);
    }

    return {
      onClick,
      count
    }
  }
}
