export const App = {
  // .vue
  // <template></template> 暂时无法
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
