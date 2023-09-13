import { h } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  setup(props, { emit }) {
    // props,count

    const emitAdd = () => {
      console.log('emitAdd')
      emit('add', 1, 2)
      emit('add-foo')
    }
    return { emitAdd }
  },
  render() {
    const btn = h(
      'button',
      {
        onClick: this.emitAdd,
      },
      'emitAddBtn'
    )

    const foo = h('p', {}, 'foo')

    return h('div', {}, [foo, btn])
  },
}
