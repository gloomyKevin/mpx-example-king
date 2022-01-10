const fs = require('fs/promises')
const path = require('path')
const { fileIsExist } = require('./util/index')

/**
 * 配置样式隔离
 * @param {string} componentsFiles 组件目录下文件
 * @param {string} styleIsolation 默认值为 apply-shared
 * @returns {Promise<void>}
 */
const configStyleIsolation = async (componentsFiles, styleIsolation = TailwindBaseConfig.SWITCH_STYLE_ISOLATION) => {
  try {
    const folderFiles = await fs.readdir(componentsFiles)
    for (let i = 0, len = folderFiles.length; i < len; i++) {
      const folderFile = folderFiles[i]
      const folderAbsFile = path.resolve(componentsFiles, folderFile)
      const folderFileStat = await fs.stat(folderAbsFile)
      if (folderFileStat.isDirectory()) {
        await configStyleIsolation(folderAbsFile)
      } else if (path.extname(folderFile) === '.json') {
        const data = await fs.readFile(folderAbsFile, 'utf-8')
        const jsonObject = JSON.parse(data)
        if (!jsonObject.styleIsolation) {
          jsonObject.styleIsolation = styleIsolation
        }
        await fs.writeFile(folderAbsFile, JSON.stringify(jsonObject))
      }
    }
  } catch (err) {
    throw err
  }
}

/**
 * 自动导入分包样式
 * @param subPackageAbsPath 分包绝对路径
 * @param subPackageImportPath 导入 css 样式路径
 * @returns {Promise<void>}
 */
const autoImportSubPkgStyle = async (subPackageAbsPath, subPackageImportPath) => {
  // 自动注入内容
  const autoImportStr = `@import "${path.relative(subPackageAbsPath, subPackageImportPath)}"; \n`
  const subPackageFiles = await fs.readdir(subPackageAbsPath)
  for (let i = 0, len = subPackageFiles.length; i < len; i++) {
    const subPackageFile = subPackageFiles[i]
    const subAbsFilePath = path.resolve(subPackageAbsPath, subPackageFile)
    const subAbsFileStat = await fs.stat(subAbsFilePath)
    if (subPackageFile === 'components') {
      // 组件级别开启 styleIsolation
      await configStyleIsolation(subAbsFilePath)
    } else if (path.extname(subAbsFilePath) === '.wxml') {
      // 页面级别自动 import 分包输出样式文件
      const subAbsStylePath = path.resolve(path.dirname(subAbsFilePath), path.basename(subAbsFilePath, path.extname(subAbsFilePath)) + '.wxss')
      const exist = await fileIsExist(subAbsStylePath)
      if (exist) {
        let data = await fs.readFile(subAbsStylePath, 'utf-8')
        let autoImportStrIndex = data.indexOf(autoImportStr)
        // 避免重复引入问题
        if (autoImportStrIndex !== -1) {
          data = data.replace(autoImportStr, '')
        }
        // 写入 import 内容
        await fs.writeFile(subAbsStylePath, `${autoImportStr} ${data}`)
      } else {
        // 直接创建文件并写入
        await fs.writeFile(subAbsStylePath, autoImportStr)
      }
    } else if (subAbsFileStat.isDirectory()) {
      await autoImportSubPkgStyle(subAbsFilePath, subPackageImportPath)
    }
  }
}

module.exports = autoImportSubPkgStyle
