#!/usr/bin/env node
// 获取自定义配置
// 获取AppJSON
// 扫描策略
// 原生脚手架执行

// 脚手架构建
const program = require('commander')
const pkg = require('./package.json')
const normalizeInjectArgvs = require('./lib/cliExpand')
// const args = arg({
//   // Types
//   '--help': Boolean,
//   '--version': Boolean,
//   '--init': String,
//   '--output': String,
//   '--config': String,

//   // Aliases
//   '-h': '--help',
//   '-v': '--version',
//   '-o': '--output',
//   '-f': '--config'
// })

program
  .version(pkg.version)
  .arguments('[args...]')
  .action((args) => {
    // normalizeInjectArgvs(args)
    console.log('%c [ args ]-28', 'font-size:13px; background:pink; color:#bf2c9f;', args)
  })

program.parse(process.argv)

console.log('process.argv', process.argv)
console.log('program.args', program.args)
