import { createRenderer } from '@guide-mini-vue/runtime-core'

function createElement(type) {
  return document.createElement(type)
}

function patchProp(el, key, prevValue, nextValue) {
  // 规范 on + Event name
  // console.log(key)
  // 具体的click
  const isOn = (key: string) => /^on[A-Z]/.test(key)
  if (isOn(key)) {
    const event = key.slice(2).toLocaleLowerCase()
    el.addEventListener(event, nextValue)
  } else {
    if (nextValue === undefined || nextValue === null) {
      el.removeAttribute(key)
    } else {
      el.setAttribute(key, nextValue)
    }
  }
}

function insert(child, parent, anchor) {
  // anchor 为dom元素
  // parent.append(el)
  // console.log('child, parent, anchor: ', child, parent, anchor)
  parent.insertBefore(child, anchor || null)
}

function remove(child) {
  const parent = child.parentNode
  if (parent) {
    parent.removeChild(child)
  }
}

function setElementText(el, text) {
  el.textContent = text
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText
})

export function createApp(...args) {
  return renderer.createApp(...args)
}

export * from '@guide-mini-vue/runtime-core'
