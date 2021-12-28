/* 开启 tailwind 子进程 */
const path = require('path')
const { spawn } = require('child_process')

module.exports = function startTailWindBuild () {
  const workerProcess = spawn('node', [path.resolve(__dirname, './processSubpackage.js')], { stdio: 'inherit' })
  workerProcess.on('close', code => {
    process.exitCode = code
  })
}
