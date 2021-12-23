const fs = require('fs/promises')
const { constants } = require('fs')
const path = require('path')
const shell = require('shelljs')
const chalk = require('chalk')

// 基本配置
const TailwindBaseConfig = {
  // 样式隔离 styleIsolation 开启样式隔离
  SWITCH_STYLE_ISOLATION: 'apply-shared',
  // 全局分包 map 映射
  subPackageMap: new Map(),
  // 默认输出 dist 路径
  outputPath: path.resolve(__dirname, '../dist/wx')
}

/**
 * 日志输出
 * @class
 */
class Logger {
  static info (...args) {
    shell.echo(chalk.cyan(...args))
  }

  static error (...args) {
    shell.echo(chalk.red(...args))
  }

  static warning (...args) {
    shell.echo(chalk.yellow(...args))
  }
}

/**
 * 判断文件是否存在
 * @param fileName 文件名
 * @returns {Promise<boolean>}
 */
const fileIsExist = async fileName => {
  let flag
  try {
    await fs.access(fileName, constants.F_OK)
    flag = true
  } catch (err) {
    flag = false
  }
  return flag
}

/**
 * 设置分包配置信息
 * @returns {Promise<void>}
 */
const setSubpackageMap = async () => {
  try {
    const data = await fs.readFile(path.resolve(TailwindBaseConfig.outputPath, './app.json'), 'utf8')
    const jsonObject = JSON.parse(data)
    const subPackages = jsonObject.subPackages
    for (let i = 0, len = subPackages.length; i < len; i++) {
      let item = subPackages[i]
      let root = item.root
      const resolveSubPackagePath = path.resolve(TailwindBaseConfig.outputPath, root)
      TailwindBaseConfig.subPackageMap.set(resolveSubPackagePath, item)
    }
  } catch (err) {
    throw err
  }
}

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
const autoImportSubPackageStyle = async (subPackageAbsPath, subPackageImportPath) => {
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
      await autoImportSubPackageStyle(subAbsFilePath, subPackageImportPath)
    }
  }
}

/**
 * 文件扫描方法
 * @param currentPath 当前扫描路径
 * @returns {Promise<void>}
 */
const recursiveScanFiles = async currentPath => {
  try {
    const currentFiles = await fs.readdir(currentPath)
    for (let i = 0, len = currentFiles.length; i < len; i++) {
      const currentFile = currentFiles[i]
      // 绝对路径
      const currentAbsPath = path.resolve(currentPath, currentFile)
      const currentAbsStat = await fs.stat(currentAbsPath)
      const isDirectory = currentAbsStat.isDirectory()
      // 设置分包映射 map
      await setSubpackageMap()
      if (TailwindBaseConfig.subPackageMap.has(currentAbsPath)) {
        // 分包路径下创建相关页面
        const fromPath = path.resolve(__dirname, '../tailwind.css')
        const configPath = path.resolve(__dirname, '../tailwind.config.js')
        // 输出 index.wxss 到分包 root
        const outPath = path.resolve(currentPath, currentAbsPath, './index.wxss')
        if (!shell.which('npx')) {
          Logger.error('sorry, this script requires npx, please update npm version!')
          shell.exit(1)
        }
        shell.exec(`npx tailwindcss build ${fromPath} -c ${configPath} -o ${outPath}`)
        // 自动导入分包样式
        await autoImportSubPackageStyle(currentAbsPath, outPath)
      } else if (isDirectory) {
        // 深度扫描
        await recursiveScanFiles(currentAbsPath)
      }
    }
  } catch (err) {
    throw err
  }
}

/**
 * 初始化方法
 */
async function init () {
  console.time('tailwind build time')
  await recursiveScanFiles(TailwindBaseConfig.outputPath)
  console.timeEnd('tailwind build time')
}

module.exports = init
