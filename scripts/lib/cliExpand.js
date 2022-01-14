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
const miniprogramAbsPath = global.globalFinalCfg.miniprogramAbsPath
const subPackageMap = global.globalFinalCfg.subPackageMap

function execCli (execCliPath, ...scanTaskQueue) {
  const configPath = setConfigPath()
  const outputPath = _setOutputPath()
  const inputPath = _setInputPath()
  const contentPath = _setContentPath()
  if (classMode === 'tailwindcss') {
    injectTailwindcss()
  } else if (classMode === 'windicss') {
    injectWindicss()
  } else {
    Logger.error('classMode输入错误，必须为 tailwindcss 或 windicss')
  }

  function _setInputPath () {
    return path.resolve(__dirname, '../presets/tailwindPreset/tailwind.css')
  }

  function _setOutputPath () {
    return path.resolve(execCliPath, './output.wxss')
  }

  function setConfigPath () {
    // TODO 修改为globalFinalConfig的configPath
    return path.resolve(__dirname, '../tailwind.config.js')
  }

  function _setContentPath () {
    let presetCfgContent = []
    // 扫描主包时，在pattern中排除分包，考虑到rott可能为多层，需要动态分析处理，这里先只考虑单层分包
    // TODO 这里的处理有点丑，看看能不能去掉scanTaskQueue传参
    const relativePath = path.relative('/Users/didi/Desktop/自己的项目/mpx-example', execCliPath)
    if (scanTaskQueue.includes(miniprogramAbsPath)) {
      const extractSubPkgPatterns = []
      const AllSubPkgAbsPath = [...subPackageMap.keys()]
      AllSubPkgAbsPath.forEach((subPkgAbsPath) => {
        extractSubPkgPatterns.push(path.relative(miniprogramAbsPath, subPkgAbsPath))
      })
      const patternsStr = `!(${extractSubPkgPatterns.join('|')})`
      presetCfgContent = `./${relativePath}/${patternsStr}/**/*.wxml`
    } else {
      presetCfgContent = `./${relativePath}/**/*.wxml`
    }
    return presetCfgContent
  }

  function injectTailwindcss () {
    // TODO 改为 不支持npx时直接node执行文件
    if (!shell.which('npx')) {
      Logger.error('sorry, this script requires npx, please update npm version!')
      shell.exit(1)
    }
    // TODO只有主包时，传入主包wxml路径集，注意异步顺序
    // TODO 配置中增加实验开关，copy cli，增加多输入和多输出的映射，并实现多输出
    shell.exec(`npx tailwindcss --config '${configPath}' -i '${inputPath}' -o '${outputPath}' --content '${contentPath}' ${cliArgs}`)
    // console.log('=====cli:', `npx tailwindcss ${cliArgs} --config ${configPath} -i ${inputPath} -o ${outputPath} --content '${presetCfgContent}' ${cliArgs}`)
  }

  function injectWindicss () {
    shell.exec(`windicss '${contentPath}' -f '${configPath}' -o '${outputPath}' ${cliArgs}`)
  }
}

module.exports = execCli
