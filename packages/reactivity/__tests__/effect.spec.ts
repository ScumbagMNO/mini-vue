import { reactive } from '../src/reactive'
import { effect, stop } from '../src/effect'
import { vi } from 'vitest'

describe('effect', () => {
  //reactive
  it('happy path', () => {
    const user = reactive({
      age: 10
    })

    let nextAge
    effect(() => {
      nextAge = user.age + 1
    })
    expect(nextAge).toBe(11)
    // update
    user.age++
    expect(nextAge).toBe(12)
  })

  it('runner', () => {
    // 1. effect(fn) function (runner) -> fn -> return
    let foo = 10
    const runner = effect(() => {
      foo++
      return 'foo'
    })
    expect(foo).toBe(11)
    const r = runner()
    expect(foo).toBe(12)
    expect(r).toBe('foo')
  })

  it('scheduler', () => {
    // 1、通过effect 第二个参数给定一个scheduler的fn
    // 2、effect 第一次执行的时候 还会执行fn
    // 3、当 响应式对象 set update 时 不会执行fn 而是scheduler
    // 4、如果说执行runner时，回再次执行fn
    let dummy
    let run: any
    const scheduler = vi.fn(() => {
      run = runner
    })
    const obj = reactive({ foo: 1 })
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler }
    )
    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    // should be called on first trigger
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)
    // should not run yet
    expect(dummy).toBe(1)
    // // manually run
    run()
    // // should have run
    expect(dummy).toBe(2)
  })

  it('stop', () => {
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
      dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)
    stop(runner)
    // obj.prop = 3
    // obj.prop = obj.prop + 1
    obj.prop++
    expect(dummy).toBe(2)
    // stopped effect should still be manually callable
    runner()
    expect(dummy).toBe(3)
  })
  it('onStop', () => {
    const obj = reactive({ foo: 1 })
    const onStop = vi.fn()
    let dummy
    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { onStop }
    )
    stop(runner)
    expect(onStop).toBeCalledTimes(1)
  })
})
