## 简介

简易构建的简单vue框架实现最简 vue3 模型，用于深入学习 vue3，通过TDD思想编写reactive，runtime-core，runtime-dom,compiler-core的happy path部分api的实现，且最后采用monorepo的架构调整项目



依赖关系

​		=>  	complier-core

vue

​		=>	runtime-dom  =>  runtime-core



## reactive

主要实现了vue3的核心api如effect、reactive、ref、computed等

## runtime-core

实现vue3关于编译时的核心逻辑，核心关键点在于vnode、component、renderer、diff算法几个方面的实现，也可以基于此部分实现自定义渲染器

## runtime-dom

是runtime-core的上层，实现vue3关于dom的编译核心逻辑，核心在于写出以dom为vnode的renderer的增删改移动逻辑

## complier-core

关于翻译template成为ast树的过程，实现解析三种类型element、text、插值、最后将template翻译成runtime-core中所需要的render函数

