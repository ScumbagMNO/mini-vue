import { computed } from '../src/computed'
import { reactive } from '../src/reactive'
import { vi } from 'vitest'

describe('computed', () => {
  it('happy path', () => {
    // 类似ref .value
    // 特点：缓存
    const user = reactive({ age: 1 })
    const age = computed(() => {
      return user.age
    })
    expect(age.value).toBe(1)
  })

  it('should computed lazily', () => {
    const value = reactive({ foo: 1 })
    const getter = vi.fn(() => value.foo)
    const cValue = computed(getter)
    //  lazy
    expect(getter).not.toHaveBeenCalled()

    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute again
    cValue.value // get
    expect(getter).toHaveBeenCalledTimes(1)

    // should not compute until needed
    value.foo = 2 // trigger -> effect -> get 重新触发
    expect(getter).toHaveBeenCalledTimes(1)

    // now it should compute
    expect(cValue.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(2)

    // should not compute again
    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  })
})
