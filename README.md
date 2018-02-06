注意要修改 node_modules/3dmodl/模块下的配置文件，
1、package.json中的 
`"main": "build/3Dmol-min.js"`
修改为
`"main": "build/3Dmol.js",`
2、build/3Dmol.js 文件中的 10354 行

`(function (global, factory) {
  (factory((global['MMTF'] = global.MMTF || {})));
}(this, function (exports) { 'use strict';
`
中的 this 关键字替换为

`typeof window !== "undefined" ? window : this`

如果不修改使用3dmol插件的时候，会出现 MMTF 未定义的错误，该问题是 webpack 对js打包方式的解析规则不同引起的，使用什么规则可以避免该错误，现在无法确定，使用修改源码的方式先使用，以后找到方法了再进行修改