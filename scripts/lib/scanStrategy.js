const path = require('path')
const { isEmptyArr, type } = require('./util/index')
// 待扫描目录队列，直接对照执行 cli
// 在windi中，则直接作为参数传入
let scanTaskQueue = []
// scanTaskQueue中对应的对应的page路径
let queuePagesPath = new Map()
const { globalFinalCfg } = global
const { globalFinalCfg: { subPackageMap, miniprogramPath, mainPkgPagesPath } } = global
const allSubpackagePath = [...subPackageMap.keys()]
const miniprogramAbsPath = path.resolve(__dirname, '..', miniprogramPath)

function normalizeSpecSubPkg (...specArr) {
  // 输入违法，中止标识
  let breakFlag = false
  let normalizedArr = []
  if (isEmptyArr([...specArr])) return
  // forEach不可中断循环，故使用常规循环
  // TODO 考虑要不要把两种报错改为唯一的catch输入违法报错
  for (let specRootName of [...specArr]) {
    if (type(specRootName) !== 'String') {
      console.error('input must be string!')
      breakFlag = true
      break
    }
    const specSubPkgPath = path.resolve(miniprogramAbsPath, specRootName)
    if (subPackageMap.has(specSubPkgPath)) {
      normalizedArr.push(specSubPkgPath)
    } else {
      console.error(`${specRootName} is not in the subpackage`)
      breakFlag = true
      break
    }
  }
  return {
    normalizedArr,
    breakFlag
  }
}

function getQueuePagesPath (queue) {
  if (queue.includes(miniprogramAbsPath)) {
    queuePagesPath.set(miniprogramAbsPath, globalFinalCfg.mainPkgPagesPath)
  }
  queue
    .filter((val) => val !== miniprogramAbsPath)
    .forEach((pkgPath) => {
      queuePagesPath.set(pkgPath, subPackageMap.get(pkgPath)?.pages)
    })
  console.log('%c [ queuePagesPath ]-50', 'font-size:13px; background:pink; color:#bf2c9f;', queuePagesPath)
}

// TODO 添加并行的 auto import 和 apply shared 方法
// TODO 再抽象一层方法，做统一
const scanStrategy = {
  'onlyMainPkg': function () {
    // TODO 再细点，拼接pages&components目录
    scanTaskQueue = miniprogramAbsPath
    getQueuePagesPath(scanTaskQueue)
  },
  'allSubPkg': function () {
    scanTaskQueue = [...allSubpackagePath]
    getQueuePagesPath(scanTaskQueue)
  },
  'onlySpecSubPkg': function (...specPkg) {
    // TODO specPkg中如果有写错的，做边界处理
    scanTaskQueue.push(...specPkg)
    getQueuePagesPath(scanTaskQueue)
  },
  'mainPkgAndAllSubPkg': function () {
    scanTaskQueue.push(miniprogramAbsPath, ...allSubpackagePath)
    getQueuePagesPath(scanTaskQueue)
  },
  'mainPkgAndSpecSubPkg': function (...specPkg) {
    scanTaskQueue.push(miniprogramAbsPath, ...specPkg)
    getQueuePagesPath(scanTaskQueue)
  }
}

function execScanStrategy (scanMode) {
  let { mainPackage, subPackage, specSubPackage } = scanMode
  const emptySpecSubPkg = isEmptyArr(specSubPackage)
  let { normalizedArr: normalizedSepcSubPkg, breakFlag } = normalizeSpecSubPkg(...specSubPackage)
  if (breakFlag) return []
  if (mainPackage && !subPackage && emptySpecSubPkg) {
    scanStrategy['onlyMainPkg']()
  }
  if (mainPackage && subPackage && emptySpecSubPkg) {
    scanStrategy['mainPkgAndAllSubPkg']()
  }
  if (mainPackage && subPackage && !emptySpecSubPkg) {
    scanStrategy['mainPkgAndSpecSubPkg'](...normalizedSepcSubPkg)
  }
  if (!mainPackage && subPackage && emptySpecSubPkg) {
    scanStrategy['allSubPkg']()
  }
  if (!mainPackage && subPackage && !emptySpecSubPkg) {
    scanStrategy['onlySpecSubPkg'](...normalizedSepcSubPkg)
  }
  return {
    scanTaskQueue,
    queuePagesPath
  }
}

module.exports = execScanStrategy
