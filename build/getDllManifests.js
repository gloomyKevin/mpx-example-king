const fs = require('fs')
const path = require('path')
const { dllConf, supportedModes } = require('../config/index')


module.exports = function getDllManifests () {
  const result = []
  if (fs.existsSync(dllConf.path)) {
    const files = fs.readdirSync(dllConf.path)
    files.forEach((file) => {
      if (/\.manifest\.json$/.test(file)) {
        const content = JSON.parse(fs.readFileSync(path.join(dllConf.path, file), 'utf8'))
        const filename = path.basename(content.name)
        const modeReg = new RegExp(`^(${supportedModes.join('|')})\\.`)
        let mode = ''
        if (modeReg.test(filename)) {
          mode = modeReg.exec(filename)[1]
        }
        result.push({
          mode,
          content
        })
      }
    })
  }
  return result
}
