// 注入到对应cli，config中的公共部分做额外处理
// input：tailwind中为参数，windi中为数组
// output：tailwind中为参数，windi中可以通过Seperate分别输出
// config：指定config，覆盖通过cosmiconfig找到的路径
// minify待确定

const shell = require('shelljs')
const path = require('path')
const { Logger } = require('./util/index')
const { globalFinalConfig: { classMode } } = global

module.exports = function execCli (execCliPath, cliArgs) {
  if (classMode === 'tailwindcss') {
    injectTailwindcss()
  } else if (classMode === 'windicss') {
    // injectWindicss()
  } else {
    console.error('input illegal')
  }

  function _setInputPath () {
    return path.resolve(__dirname, '../presets/tailwindPreset/tailwind.css')
  }

  function _setOutputPath () {
    return path.resolve(execCliPath, './index.wxss')
  }

  // 每次循环中，config.content都要动态改变
  function setConfigPath () {
    // TODO 修改为globalFinalConfig的configPath
    const presetCfgContent = `${execCliPath}/**/*.wxml`
    return path.resolve(__dirname, '../tailwind.config.js')
  }

  function injectTailwindcss () {
    // TODO 改为 不支持npx时直接执行文件
    if (!shell.which('npx')) {
      Logger.error('sorry, this script requires npx, please update npm version!')
      shell.exit(1)
    }
    shell.exec(`npx tailwindcss build -c ${setConfigPath()} -i ${_setInputPath()} -o ${_setOutputPath()} ${cliArgs}`)
  }

  // function injectWindicss () {
  //   shell.exec(`windicss '${inputPath}' -f ${configPath} -o ${outPath} ${normalizeInjectArgvs()}`)
  // }
}
