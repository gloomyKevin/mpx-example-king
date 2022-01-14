#!/usr/bin/env node
const fs = require('fs/promises')
const path = require('path')
const fg = require('fast-glob')
const { getCommonClass } = require('mp-common-class')
const { Logger } = require('./lib/util/index')
const getMergedConfig = require('./lib/resolveConfig')
const { getSpecificArgsObj, parseCliArgs } = require('./lib/resolveCliArgs')

const globalConstants = {
  // 样式隔离 styleIsolation 开启样式隔离
  SWITCH_STYLE_ISOLATION: 'apply-shared',
  // map 存储 app.json 中的分包信息
  subPackageMap: new Map(),
  // 注册在主包的页面路径
  mainPkgPagesPath: []
}

const getFinalConfig = async () => {
  const mergedConfig = await getMergedConfig()
  const { specificArgsObj, restArgs } = getSpecificArgsObj(parseCliArgs())
  const restArgsObj = { cliArgs: restArgs }
  const finalConfig = Object.assign(globalConstants, mergedConfig, specificArgsObj, restArgsObj)
  return finalConfig
}

const mountFinalCfgToGlobal = async () => {
  // const { globalFinalConfig: { miniprogramPath } } = global
  // 后面的同类型写法：为啥解构赋值报错
  const miniprogramPath = global.globalFinalCfg.miniprogramPath
  global.globalFinalCfg.miniprogramAbsPath = path.resolve(__dirname, miniprogramPath)
}

// 通过app.json构建map并挂载到全局
const setSubpackageMap = async () => {
  // let { globalFinalConfig: { miniprogramAbsPath } } = global
  const miniprogramAbsPath = global.globalFinalCfg.miniprogramAbsPath
  try {
    const appContent = await fs.readFile(path.resolve(miniprogramAbsPath, './app.json'), 'utf8')
    const appContentObject = JSON.parse(appContent)
    global.globalFinalCfg.mainPkgPagesPath = appContentObject.pages
    const subPackages = appContentObject?.subPackages
    if (!subPackages) {
      // 用户如果没配置分包，则校验配置，warning并默认走主包输出配置
    }
    subPackages.forEach((curSubPkg, index) => {
      const subPkgRootName = curSubPkg.root
      const subPkgAbsPath = path.resolve(miniprogramAbsPath, subPkgRootName)
      global.globalFinalCfg.subPackageMap.set(subPkgAbsPath, curSubPkg)
    })
  } catch (err) {
    throw err
  }
}

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
//    cliArgs
//   // 以下为可选，合并策略待定
//   configPath: ''
// }

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

// 删除源文件
// TODO 待对比全删和只删该次未用到文件，以及未来watch模式优化
const deleteOldOutputFiles = async () => {
  const miniprogramAbsPath = global.globalFinalCfg.miniprogramAbsPath
  const relativePath = path.relative('/Users/didi/Desktop/自己的项目/mpx-example', miniprogramAbsPath)
  const projectRootPattern = fg.sync(`./${relativePath}/**/output.wxss`)
  // TODO 是否有更优雅的批量删除api
  projectRootPattern.forEach((outputFile) => {
    fs.unlink(outputFile)
  })
}

const extractSubPkgCommonStyle = async (...scanTaskQueue) => {
  const miniprogramAbsPath = global.globalFinalCfg.miniprogramAbsPath
  const subPkgAbsPath = scanTaskQueue.filter((curPkgAbsPath) => {
    return curPkgAbsPath !== miniprogramAbsPath
  })
  getCommonClass({ weight: 1, css: 'output.wxss', commonCssName: 'common.wxss', mainfile: '/Users/didi/Desktop/CommonCsstest/mpx-example-king/dist/wx', subpackageArr: [...subPkgAbsPath] })
}

// refactor: 重写原recursiveScanFiles，不靠循环驱动，而是靠遍历器驱动
function execCliByCssMode (...scanTaskQueue) {
  const execCli = require('./lib/cliExpand')
  scanTaskQueue.forEach((toBeScannedPath) => {
    execCli(toBeScannedPath, ...scanTaskQueue)
  })
}

const asyncSchedule = async () => {
  global.globalFinalCfg = await getFinalConfig()
  await mountFinalCfgToGlobal()
  await setSubpackageMap()
  // console.log('======全局配置======', global.globalFinalCfg)
  const execScanStrategy = require('./lib/scanStrategy')
  const { globalFinalCfg: { cssMode } } = global
  const { scanTaskQueue, queuePagesPath } = await execScanStrategy(cssMode)
  // console.log('======待扫描队列======', scanTaskQueue)
  const processSubPkg = require('./lib/processSubpackage')
  await processSubPkg(queuePagesPath, ...scanTaskQueue)
  await deleteOldOutputFiles()
  await execCliByCssMode(...scanTaskQueue)
  await extractSubPkgCommonStyle(...scanTaskQueue)
}

// TODO 重复执行cli时间损耗较大，考虑优化或者 例如 开发模式下变成只生成主包模式
// TODO rebuild 时，检测到上次残留文件则删除，或者先全量删除（在没有watch前）
// TODO 接入postcss提重入口

async function init () {
  Logger.warning('==========tailwind compile start==========')
  console.time('tailwind build time')
  await asyncSchedule()
  Logger.warning('==========tailwind compile end==========')
  console.timeEnd('tailwind build time')
}

init()
