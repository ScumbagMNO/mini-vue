import { reactive } from '@guide-mini-vue/reactivity'
import { nextTick } from '../src/scheduler'
import { vi } from 'vitest'
import { watchEffect } from '../src/apiWatch'

describe('api: watch', () => {
  it('effect', async () => {
    const state = reactive({ count: 0 })
    let dummy
    watchEffect(() => {
      dummy = state.count
    })
    expect(dummy).toBe(0)
    state.count++
    await nextTick()
    expect(dummy).toBe(1)
  })

  it('stopping the watcher (effect)', async () => {
    const state = reactive({ count: 0 })
    let dummy
    const stop = watchEffect(() => {
      dummy = state.count
    })
    expect(dummy).toBe(0)
    state.count++
    await nextTick()
    expect(dummy).toBe(1)
    stop()
    // should not update
    state.count++
    await nextTick()
    expect(dummy).toBe(1)
  })

  it('cleanup registration (effect)', async () => {
    const cleanup = vi.fn()
    const state = reactive({ count: 0 })
    let dummy
    const stop = watchEffect(onCleanup => {
      onCleanup(cleanup)
      dummy = state.count
    })
    expect(dummy).toBe(0)
    state.count++
    await nextTick()
    expect(dummy).toBe(1)
    expect(cleanup).toHaveBeenCalledTimes(1)
    // should call cleanup function
    stop()
    expect(cleanup).toHaveBeenCalledTimes(2)
  })
})
