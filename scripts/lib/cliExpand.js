// 注入到对应cli，config中的公共部分做额外处理
// input：tailwind中为参数，windi中为数组
// output：tailwind中为参数，windi中可以通过Seperate分别输出
// config：指定config，覆盖通过cosmiconfig找到的路径
// minify待确定

const shell = require('shelljs')
const path = require('path')
const { globalFinalConfig } = global

module.exports = function execCli (args, outputPath) {
  const { classMode } = globalFinalConfig
  if (classMode === 'tailwindcss') {
    injectTailwindcss()
  } else if (classMode === 'windicss') {
    // injectWindicss()
  } else {
    console.error('input illegal')
  }

  // 不对外暴露自定义
  function _setInputPath () {
    return path.resolve(__dirname, '../presets/tailwindPreset/tailwind.css')
  }

  function setConfigPath () {
    // 给config为默认
    return path.resolve(__dirname, '../tailwind.config.js')
  }

  function injectTailwindcss () {
    shell.exec(`npx tailwindcss build -c ${setConfigPath()} -i ${_setInputPath()} -o ${outputPath} ${args}`)
  }

  // function injectWindicss () {
  //   shell.exec(`windicss '${inputPath}' -f ${configPath} -o ${outPath} ${normalizeInjectArgvs()}`)
  // }
}
