import { h } from '../../lib/guide-mini-vue.esm.js'
import { ref } from '../../lib/guide-mini-vue.esm.js'

export const App = {
  name: 'App',
  setup() {
    const count = ref(0)
    const onClick = () => {
      count.value++
    }

    const props = ref({
      foo: 'foo',
      bar: 'bar',
    })
    console.log(props)
    // composition api
    const onChangePropsDemo1 = () => {
      props.value.foo = 'new-foo'
    }
    const onChangePropsDemo2 = () => {
      props.value.foo = undefined
    }
    const onChangePropsDemo3 = () => {
      props.value = { foo: 'foo' }
    }
    return {
      count,
      props,
      onClick,
      onChangePropsDemo1,
      onChangePropsDemo2,
      onChangePropsDemo3,
    }
  },

  render() {
    console.log(this.props)
    return h(
      'div',
      {
        id: 'root',
        ...this.props,
      },
      [h('div', {}, 'count: ' + this.count), h('button', { onClick: this.onChangePropsDemo1 }, 'changeProps - 值改变了 - 修改'), h('button', { onClick: this.onChangePropsDemo2 }, 'changeProps - 值改变了 - null'), h('button', { onClick: this.onChangePropsDemo3 }, 'changeProps - 值改变了 - 删除')]
    )
  },
}
