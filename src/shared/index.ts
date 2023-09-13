export const extend = Object.assign

export const isObject = (value: any): boolean => {
  return typeof value === 'object' && value !== null
}

export const hasChanged = (val, newVal) => {
  return !Object.is(val, newVal)
}

export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key)

export const camelize = (str) => {
  return str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : ''
  })
}

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

export const toHandlerKey = (str: string) => (str ? 'on' + capitalize(str) : '')
