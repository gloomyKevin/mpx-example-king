const fs = require('fs/promises')
const fg = require('fast-glob')
const path = require('path')
// const { fileIsExist } = require('./util/index')
// const miniprogramAbsPath = global.globalFinalCfg.miniprogramAbsPath
const subPackageMap = global.globalFinalCfg.subPackageMap
const SWITCH_STYLE_ISOLATION = global.globalFinalCfg.SWITCH_STYLE_ISOLATION
const subPkgPath = [...subPackageMap.keys()]

// 思路：从两个维度作区分
// pages：auto import
// components：open apply shared
// 通过fast-glob驱动扫描
// const glob = require('glob')

// 设置scanTaskQueue过程中，同步生成pageQueue
// 扫描过程中：在pageList中则应用页面逻辑pagesImportStyle，不在则应用组件逻辑componentsOpenApplyShared
const processSubPkg = async (pagesPath, ...scanTaskQueue) => {
  // pagesImportStyle 和 componentsOpenApplyShared 并行提速
  scanTaskQueue.forEach((scanTaskPkg) => {
    // TDDO 路径输出只在tailwind debug模式下开启，windicss自带
    // console.log('======当前扫描范围======', scanTaskPkg)
    const pageJSONFile = []
    const pageWXSSFile = []
    pagesPath.get(scanTaskPkg).forEach((taskPagePath) => {
      pageJSONFile.push(path.resolve(scanTaskPkg, `${taskPagePath}.json`))
      // 直接获取到 pagesPath.wxml，执行 自动import
      // TODO 拼出的路径有问题
      const pageWXSSPath = path.resolve(scanTaskPkg, `${taskPagePath}.wxss`)
      pageWXSSFile.push(pageWXSSPath)

      // pagesImportStyle(pageWXSSPath, scanTaskPkg)
    })
    // console.log('======当前扫描得到页面.wxss=====', pageWXSSFile)

    // // 扫描得到全部.wxss后缀文件路径数组，剔除pagesPath路径，剩下为components路径，执行 apply-shred 校验与开启
    // // 在当前包范围内，扫描得到全部.wxss后缀文件路径数组
    // TODO 扫描主包时，要排除掉分包
    // TODO 此处逻辑不完善，但结果正确，待确定原因
    // TODO 会误拿到其他类型的json文件，考虑如何规避
    // const allWXSSFile = fg.sync([`${scanTaskPkg}/**/*.json`], { ignore: subPkgPath })
    const allWXSSFile = fg.sync(`${scanTaskPkg}/**/*.json`, { ignore: subPkgPath })
    // 剔除pagesPath路径
    const componentsWXSSFile = allWXSSFile.filter((WXSSFile) => {
      return !pageJSONFile.includes(WXSSFile)
    })
    // console.log('=====当前扫描得到组件.json=====', componentsWXSSFile)
    componentsOpenApplyShared(...componentsWXSSFile)
  })
}

// 页面的wxss文件import当前分包下打出的样式
// TODO 边界处理：防止重复注入 & 无wxss则开启（文件需要正确命名）
const pagesImportStyle = async (pageWXSSPath, tailwindOutputDir) => {
  console.log('%c [ tailwindOutputDir ]-52', 'font-size:13px; background:pink; color:#bf2c9f;', tailwindOutputDir)
  console.log('%c [ pageWXSSPath ]-52', 'font-size:13px; background:pink; color:#bf2c9f;', pageWXSSPath)
  // TODO 路径有问题
  // const autoImportStatement = `@import "${path.relative(tailwindOutputDir, pageWXSSPath)}"; \n`
  const autoImportStatement = `@import "${path.relative(pageWXSSPath, tailwindOutputDir)}"; \n`
  // 首行写入语句
  let WXSSContent = await fs.readFile(pageWXSSPath, 'utf-8')
  await fs.writeFile(pageWXSSPath, `${autoImportStatement} ${WXSSContent}`)
}

// 组件的json文件校验并开启apply-shared
const componentsOpenApplyShared = async (...cmpJSONPathArr) => {
  // TODO 用户已配置styleIsolation时，增加策略及提示
  for (let curCmpJSONPath of cmpJSONPathArr) {
    const curCmpJSONContent = await fs.readFile(curCmpJSONPath, 'utf-8')
    const jsonObject = JSON.parse(curCmpJSONContent)
    if (!jsonObject.styleIsolation) {
      jsonObject.styleIsolation = SWITCH_STYLE_ISOLATION
    }
    await fs.writeFile(curCmpJSONPath, JSON.stringify(jsonObject))
  }
}

module.exports = processSubPkg

// /**
//  * 配置样式隔离
//  * @param {string} componentsFiles 组件目录下文件
//  * @param {string} styleIsolation 默认值为 apply-shared
//  * @returns {Promise<void>}
//  */
// const configStyleIsolation = async (componentsFiles, styleIsolation = TailwindBaseConfig.SWITCH_STYLE_ISOLATION) => {
//   try {
//     const folderFiles = await fs.readdir(componentsFiles)
//     for (let i = 0, len = folderFiles.length; i < len; i++) {
//       const folderFile = folderFiles[i]
//       const folderAbsFile = path.resolve(componentsFiles, folderFile)
//       const folderFileStat = await fs.stat(folderAbsFile)
//       if (folderFileStat.isDirectory()) {
//         await configStyleIsolation(folderAbsFile)
//       } else if (path.extname(folderFile) === '.json') {
//         const data = await fs.readFile(folderAbsFile, 'utf-8')
//         const jsonObject = JSON.parse(data)
//         if (!jsonObject.styleIsolation) {
//           jsonObject.styleIsolation = styleIsolation
//         }
//         await fs.writeFile(folderAbsFile, JSON.stringify(jsonObject))
//       }
//     }
//   } catch (err) {
//     throw err
//   }
// }

// /**
//  * 自动导入分包样式
//  * @param subPackageAbsPath 分包绝对路径
//  * @param subPackageImportPath 导入 css 样式路径
//  * @returns {Promise<void>}
//  */
// const autoImportSubPkgStyle = async (subPackageAbsPath, subPackageImportPath) => {
//   // 自动注入内容
//   const autoImportStr = `@import "${path.relative(subPackageAbsPath, subPackageImportPath)}"; \n`
//   const subPackageFiles = await fs.readdir(subPackageAbsPath)
//   for (let i = 0, len = subPackageFiles.length; i < len; i++) {
//     const subPackageFile = subPackageFiles[i]
//     const subAbsFilePath = path.resolve(subPackageAbsPath, subPackageFile)
//     const subAbsFileStat = await fs.stat(subAbsFilePath)
//     if (subPackageFile === 'components') {
//       // 组件级别开启 styleIsolation
//       await configStyleIsolation(subAbsFilePath)
//     } else if (path.extname(subAbsFilePath) === '.wxml') {
//       // 页面级别自动 import 分包输出样式文件
//       const subAbsStylePath = path.resolve(path.dirname(subAbsFilePath), path.basename(subAbsFilePath, path.extname(subAbsFilePath)) + '.wxss')
//       const exist = await fileIsExist(subAbsStylePath)
//       if (exist) {
//         let data = await fs.readFile(subAbsStylePath, 'utf-8')
//         let autoImportStrIndex = data.indexOf(autoImportStr)
//         // 避免重复引入问题
//         if (autoImportStrIndex !== -1) {
//           data = data.replace(autoImportStr, '')
//         }
//         // 写入 import 内容
//         await fs.writeFile(subAbsStylePath, `${autoImportStr} ${data}`)
//       } else {
//         // 直接创建文件并写入
//         await fs.writeFile(subAbsStylePath, autoImportStr)
//       }
//     } else if (subAbsFileStat.isDirectory()) {
//       await autoImportSubPkgStyle(subAbsFilePath, subPackageImportPath)
//     }
//   }
// }
