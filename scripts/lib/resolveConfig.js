const { cosmiconfig } = require('cosmiconfig')
// const { resolve } = require('path/posix')
const defaultConfig = require('./defaultConfig')

function mergeConfig (cfg) {
  return Object.assign(cfg, defaultConfig)
}

module.exports = function getMergedConfig () {
  // TODO自定义查找机制，如果只逐级向上查找，第一配置文件不好放在其它自定义目录下，第二不好与外层的默认配置合并作为兜底，如果无法扩展就就要求用户指定
  const explorer = cosmiconfig('mini')
  return explorer.search()
    .then((result) => {
      const finalResult = mergeConfig(result.config)
      return finalResult
      // return new Promise((resolve, reject) => {
      //   console.log('%c [ finalResult ]-10', 'font-size:13px; background:pink; color:#bf2c9f;', finalResult)
      //   resolve(finalResult)
      // })
      // result.config is the parsed configuration object.
      // result.filepath is the path to the config file that was found.
      // result.isEmpty is true if there was nothing to parse in the config file.
    })
    .catch(() => {
      console.error('无法找到mini.config.js文件，将使用默认设置')
      // TODO与外层默认配置合并
    })
}
