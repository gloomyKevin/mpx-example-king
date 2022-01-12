const path = require('path')
const { isEmptyArr, type, Logger } = require('./util/index')
// 待扫描目录队列，直接对照执行 cli
// 在windi中，则直接作为参数传入
// TODO 修改为set解决重复输入
const scanTaskQueue = []
// scanTaskQueue中对应的对应的page路径
const queuePagesPath = new Map()
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
    queuePagesPath.set(miniprogramAbsPath, mainPkgPagesPath)
  }
  queue
    .filter((val) => val !== miniprogramAbsPath)
    .forEach((pkgPath) => {
      queuePagesPath.set(pkgPath, subPackageMap.get(pkgPath)?.pages)
    })
}

// TODO 添加并行的 auto import 和 apply shared 方法
// TODO 再抽象一层方法，做统一
const scanStrategy = {
  'onlyMainPkg': function () {
    Logger.info('当前输出模式:仅主包')
    // TODO 再细点，拼接pages&components目录
    scanTaskQueue = [miniprogramAbsPath]
    getQueuePagesPath(scanTaskQueue)
  },
  'allSubPkg': function () {
    Logger.info('当前输出模式:仅全部分包')
    scanTaskQueue = [...allSubpackagePath]
    getQueuePagesPath(scanTaskQueue)
  },
  'onlySpecSubPkg': function (...specPkg) {
    Logger.info('当前输出模式:仅指定分包')
    // TODO specPkg中如果有写错的，做边界处理
    scanTaskQueue.push(...specPkg)
    getQueuePagesPath(scanTaskQueue)
  },
  'mainPkgAndAllSubPkg': function () {
    Logger.info('当前输出模式:主包+全部分包')
    scanTaskQueue.push(miniprogramAbsPath, ...allSubpackagePath)
    getQueuePagesPath(scanTaskQueue)
  },
  'mainPkgAndSpecSubPkg': function (...specPkg) {
    Logger.info('当前输出模式:主包+指定分包')
    scanTaskQueue.push(miniprogramAbsPath, ...specPkg)
    getQueuePagesPath(scanTaskQueue)
  }
}

function execScanStrategy (scanMode) {
  let { mainPackage, subPackage, specSubPackage } = scanMode
  const emptySpecSubPkg = isEmptyArr(specSubPackage)
  let { normalizedArr: normalizedSepcSubPkg, breakFlag } = normalizeSpecSubPkg(...specSubPackage)
  if (breakFlag) return []
  if (mainPackage && !subPackage) {
    // TODO 考虑 当 subPackage 为false但specSubPackage时，控制台添加警告
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
