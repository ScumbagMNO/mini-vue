export const extend = Object.assign

export const isObject = (value: any): boolean => {
  return typeof value === 'object' && value !== null
}

export const hasChanged = (val, newVal) => {
  return !Object.is(val, newVal)
}
