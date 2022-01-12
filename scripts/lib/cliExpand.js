// 注入到对应cli，config中的公共部分做额外处理
// input：tailwind中为参数，windi中为数组
// output：tailwind中为参数，windi中可以通过Seperate分别输出
// config：指定config，覆盖通过cosmiconfig找到的路径
// minify待确定

const shell = require('shelljs')
const path = require('path')
const { Logger } = require('./util/index')
// const { globalFinalConfig: { classMode, cliArgs } } = global
const classMode = global.globalFinalCfg.classMode
const cliArgs = global.globalFinalCfg.cliArgs

function execCli (execCliPath) {
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
    return path.resolve(execCliPath, './output.wxss')
  }

  function setConfigPath () {
    // TODO 修改为globalFinalConfig的configPath
    // const tailwindConfig = require('../tailwind.config')
    // tailwindConfig.content = presetCfgContent
    // console.log('%c [ tailwindConfig.content ]-38', 'font-size:13px; background:pink; color:#bf2c9f;', tailwindConfig.content)
    return path.resolve(__dirname, '../tailwind.config.js')
  }

  function _setContentPath () {
    const relativePath = path.relative('/Users/didi/Desktop/自己的项目/mpx-example', execCliPath)
    const presetCfgContent = `./${relativePath}/**/*.wxml`
    return presetCfgContent
  }

  async function injectTailwindcss () {
    // TODO 改为 不支持npx时直接执行文件
    if (!shell.which('npx')) {
      Logger.error('sorry, this script requires npx, please update npm version!')
      shell.exit(1)
    }

    const configPath = setConfigPath()
    const outputPath = _setOutputPath()
    const inputPath = _setInputPath()
    const contantPath = _setContentPath()
    shell.exec(`npx tailwindcss --config '${configPath}' -i '${inputPath}' -o '${outputPath}' --content '${contantPath}' ${cliArgs}`)
    // console.log('=====cli:', `npx tailwindcss ${cliArgs} --config ${configPath} -i ${inputPath} -o ${outputPath} --content '${presetCfgContent}' ${cliArgs}`)
  }

  // function injectWindicss () {
  //   shell.exec(`windicss '${inputPath}' -f ${configPath} -o ${outPath} ${normalizeInjectArgvs()}`)
  // }
}

module.exports = execCli
