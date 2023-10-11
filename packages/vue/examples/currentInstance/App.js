import { h, getCurrentInstance } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App = {
  name: 'App',
  // .vue
  // render

  render() {
    const app = h('div', {}, [h('p', {}, 'currentInstance demo'), h(Foo)])

    // object key
    return app
  },

  setup() {
    const instance = getCurrentInstance()
    console.log('App:', instance)
    return {}
  },
}
