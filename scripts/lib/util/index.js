
const fs = require('fs/promises')
const shell = require('shelljs')
const chalk = require('chalk')
const { constants } = require('fs')
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

module.exports = {
  Logger,
  fileIsExist
}
