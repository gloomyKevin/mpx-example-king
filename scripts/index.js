#!/usr/bin/env node
const fs = require('fs/promises')
// const shell = require('shelljs')
const path = require('path')
const execCli = require('./lib/cliExpand')
const { Logger } = require('./lib/util/index')
// const autoImportSubPackageStyle = require('./lib/processSubpackage')
const getMergedConfig = require('./lib/resolveConfig')
const { getSpecificArgsObj, parseCliArgs } = require('./lib/resolveCliArgs')
const scanTaskQueue = require('./lib/scanStrategy')

const globalConstants = {
  // 样式隔离 styleIsolation 开启样式隔离
  SWITCH_STYLE_ISOLATION: 'apply-shared',
  // map 存储 app.json 中的分包
  subPackageMap: new Map()
}

let args
const getFinalConfig = async () => {
  const mergedConfig = await getMergedConfig()
  const { specificArgsObj, restArgs: args } = getSpecificArgsObj(parseCliArgs())
  const finalConfig = Object.assign(globalConstants, mergedConfig, specificArgsObj)
  console.log('finalConfig: ', finalConfig)
  return finalConfig
}

const mountFinalCfgToGlobal = async () => {
  // const globalCfg = getFinalConfig()
  global.globalFinalCfg = await getFinalConfig()
}
mountFinalCfgToGlobal()

const { globalFinalConfig: { miniprogramPath } } = global
const miniprogramAbsPath = path.resolve(__dirname, miniprogramPath)

// 通过app.json构建map并挂载到全局
const setSubpackageMap = async () => {
  try {
    const appContent = await fs.readFile(path.resolve(miniprogramAbsPath, './app.json'), 'utf8')
    const appContentObject = JSON.parse(appContent)
    const subPackages = appContentObject.subPackages
    for (let i = 0, len = subPackages.length; i < len; i++) {
      let item = subPackages[i]
      let root = item.root
      const resolveSubPackagePath = path.resolve(miniprogramAbsPath, root)
      global.globalFinalConfig.subPackageMap.set(resolveSubPackagePath, item)
    }
  } catch (err) {
    throw err
  }
}
setSubpackageMap()

// globalFinalConfig 示例
// const globalFinalConfig = {
//   // 样式隔离 styleIsolation 开启样式隔离
//   SWITCH_STYLE_ISOLATION: 'apply-shared',
//   // map 存储 app.json 中的分包
//   subPackageMap: new Map(),
//   // 小程序所在目录
//   // 小程序文件目录,此处以scripts作为相对，有问题，待修改
//   miniprogramPath: '../dist/wx',
//   // 'tailwindcss' 'windicss'
//   classMode: 'tailwindcss',
//   // 样式生成策略
//   cssMode: {
//     mainPackage: true,
//     subPackage: true,
//     specSubPackage: []
//   },
//   // 以下为可选，合并策略待定
//   configPath: ''
// }

// // classMode策略
// // 输出当前策略提示

// // 以下为tailwind的build模式
// // tailwindBuild()
// // 扫描
// /**
//  * 文件扫描方法
//  * @param currentPath 当前扫描路径
//  * @returns {Promise<void>}
//  */
// // TODO 使用fast-glob或者node-glob加速扫描
// const recursiveScanFiles = async currentPath => {
//   try {
//     const currentFiles = await fs.readdir(currentPath)
//     for (let i = 0, len = currentFiles.length; i < len; i++) {
//       const currentFile = currentFiles[i]
//       // 绝对路径
//       const currentAbsPath = path.resolve(currentPath, currentFile)
//       const currentAbsStat = await fs.stat(currentAbsPath)
//       const isDirectory = currentAbsStat.isDirectory()
//       // 设置分包映射 map
//       await setSubpackageMap()
//       if (globalFinalConfig.subPackageMap.has(currentAbsPath)) {
//         // 分包路径下创建相关页面
//         // 输出 index.wxss 到分包 root
//         // TODO 增加cssMode判断，改变扫描执行策略及outputPath生成策略
//         const outputPath = path.resolve(currentPath, currentAbsPath, './index.wxss')
//         // TODO 不支持npx时直接执行文件
//         if (!shell.which('npx')) {
//           // Logger.error('sorry, this script requires npx, please update npm version!')
//           shell.exit(1)
//         }
//         execCli(args, outputPath)
//         // 自动导入分包样式
//         await autoImportSubPackageStyle(currentAbsPath, outputPath)
//       } else if (isDirectory) {
//         // 深度扫描
//         await recursiveScanFiles(currentAbsPath)
//       }
//     }
//   } catch (err) {
//     throw err
//   }
// }

// refactor: 重写recursiveScanFiles，不靠循环驱动，而是靠遍历器驱动
function execCliByCssMode () {
  scanTaskQueue.forEach((toBeScannedPath) => {
    execCli(toBeScannedPath, args)
  })
}

// TODO 接入postcss提重入口

async function init () {
  Logger.warning('==========tailwind compile start==========')
  console.time('tailwind build time')
  await execCliByCssMode()
  Logger.warning('==========tailwind compile end==========')
  console.timeEnd('tailwind build time')
}

init()
