export function initProps(instance, rawProps) {
  instance.props = rawProps || {}
  // attrs
}

// 更新场景 foo值和之前不一样 修该
//  null || undefined 删除
// bar 这个属性在新的里面没有了删除
