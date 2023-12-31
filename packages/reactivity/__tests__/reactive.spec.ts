import { isProxy, isReactive, reactive } from '../src/reactive'
describe('reactive', () => {
  it('happy path', () => {
    const original = { foo: 1 }
    const observed = reactive(original)
    // observed.foo = 2
    expect(observed).not.toBe(original)
    expect(observed.foo).toBe(1)
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
    expect(isProxy(observed)).toBe(true)
  })
})
