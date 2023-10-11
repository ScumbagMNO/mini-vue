export * from '@guide-mini-vue/runtime-dom'

import { baseCompile } from '@guide-mini-vue/compiler-core'
import * as runtimeDom from '@guide-mini-vue/runtime-dom'
import { registerRuntimeCompiler } from '@guide-mini-vue/runtime-dom'
function compileToFunction(template) {
  const { code } = baseCompile(template)
  const render = new Function('Vue', code)(runtimeDom)
  return render
}

// 赋值给全局编译器
registerRuntimeCompiler(compileToFunction)
