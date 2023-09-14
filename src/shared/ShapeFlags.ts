export const enum ShapeFlags {
  ElEMENT = 1, //0001
  STATEFUL_COMPONENT = 1 << 1, // 0010
  TEXT_CHILDREN = 1 << 2, // 0100
  ARRAY_CHILDREN = 1 << 3, // 1000
  SLOT_CHILDREN = 1 << 4, // 10000
}
// vnode -> stateful_component->
// 1. 可以设置 修改
// 2. 查找
// 位运算方式
//修改 | （两位都为0, 才为0）
//查找 & （两位都为1，才为1）
