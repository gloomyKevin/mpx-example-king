const path = require('path')
// 待扫描目录队列，直接对照执行 cli
// 在windi中，则直接作为参数传入
let scanTaskQueue = []
const { globalFinalConfig: { subPackageMap, cssMode, miniprogramPath } } = global
const allSubpackagePath = [subPackageMap.keys()]
const miniprogramAbsPath = path.resolve(__dirname, miniprogramPath)

// TODO 添加并行的 auto import 和 apply shared 方法
const scanStrategy = {
  'onlyMainPkg': function () {
    // TODO 再细点，拼接pages&components目录
    scanTaskQueue = miniprogramAbsPath
  },
  'allSubPkg': function () {
    scanTaskQueue = allSubpackagePath
  },
  'onlySpecSubPkg': function (...specPkg) {
    // TODO specPkg中如果有写错的，做边界处理
    scanTaskQueue.push(...specPkg)
  },
  'mainPkgAndAllSubPkg': function () {
    scanTaskQueue.push(miniprogramAbsPath, allSubpackagePath)
  },
  'mainPkgAndSpecSubPkg': function (...specPkg) {
    // TODO specPkg中如果有写错的，做边界处理
    scanTaskQueue.push(miniprogramAbsPath, ...specPkg)
  }
}

function execScanStrategy (mode) {
  const { mainPackage, subPackage, specSubPackage } = mode
  if (mainPackage && !subPackage && !specSubPackage) {
    scanStrategy['onlyMainPkg']()
  }
  if (mainPackage && subPackage && !specSubPackage) {
    scanStrategy['mainPkgAndAllSubPkg']()
  }
  if (mainPackage && subPackage && specSubPackage) {
    scanStrategy['mainPkgAndSpecSubPkg'](...specSubPackage)
  }
  if (!mainPackage && subPackage && !specSubPackage) {
    scanStrategy['allSubPkg']()
  }
  if (!mainPackage && subPackage && specSubPackage) {
    scanStrategy['onlySpecSubPkg'](...specSubPackage)
  }
}

execScanStrategy(cssMode)

module.exports = scanTaskQueue

// function run () {
//   scanTaskQueue.forEach((toBeScannedPath) => {
//     execCli(toBeScannedPath)
//   })
// }
