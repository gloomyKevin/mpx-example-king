// 不做重写，将输入的cli指令直接透传到tailwind或者windi

// 按照策略合并后的 argvs & 自定义config

// 根据classMode判断

// 注入到对应cli，config中的公共部分做额外处理
// input：tailwind中为参数，windi中为数组
// output：tailwind中为参数，windi中可以通过Seperate分别输出
// config：指定config，覆盖通过cosmiconfig找到的路径
// minify待确定

const shell = require('shelljs')
const path = require('path')
// const searchConfig = require('./resolveConfig')
const customConfig = {
  // 小程序文件目录
  miniprogramPath: './dist/wx',
  classMode: 'tailwindcss',
  cssMode: {
    mainPackage: true,
    subPackage: true,
    specSubPackage: []
  },
  configPath: '',
  outputPath: ''
}

// 参数三个来源
// config配置文件
// cli 传入参数
// 动态生成的当前扫描目录，即css文件生成的位置
module.exports = function execCli (customConfig, args, outputPath) {

  const { cssMode, configPath } = customConfig

  if (cssMode === 'tailwindcss') {
    injectTailwindcss()
  } else if (cssMode === 'windicss') {
    // injectWindicss()
  } else {
    console.error('input illegal')
  }

  // 不对外暴露自定义
  function _setInputPath () {
    return path.resolve(__dirname, '../presets/tailwindPreset/tailwind.css')
  }

  function setConfigPath () {
    return path.resolve(__dirname, '../tailwind.config.js')
  }

  // 剔除通用配置项
  // function normalizeInjectArgvs (args) {
  //   // 合并config
  //   // 剔除通用配置项
  //   exclusiveArgs()
  //   restArgs.join(' ')
  // }

  function injectTailwindcss () {
    // shell.exec(`npx tailwindcss -c ${setConfigPath()} -i ${_setInputPath()} -o ${outputPath} --[${restArgs}]`)
    shell.exec(`npx tailwindcss -c ${setConfigPath()} -i ${_setInputPath()} -o ${outputPath}`)
  }

  // function injectWindicss () {
  //   shell.exec(`windicss '${inputPath}' -f ${configPath} -o ${outPath} ${normalizeInjectArgvs()}`)
  // }
}

// module.exports = function normalizeCliArgs (args) {
//   // arrToObj(args)
// }
