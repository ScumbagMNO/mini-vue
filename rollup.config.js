// import json from '@rollup/plugin-json'
import typescript from '@rollup/plugin-typescript'
// import pkg from './package.json' assert { type: 'json' }

export default {
  input: './packages/vue/src/index.ts',
  output: [
    // 1. cjs -> commonjs
    // 2. esm
    {
      format: 'cjs',
      file: 'packages/vue/dist/guide-mini-vue.cjs.js'
    },
    {
      format: 'es',
      file: 'packages/vue/dist/guide-mini-vue.esm.js'
    }
  ],
  // plugins: [typescript(), json()]
  plugins: [typescript()]
}
