const { cosmiconfig } = require('cosmiconfig')
const defaultConfig = require('./defaultConfig')

module.exports = function getMergedConfig () {
  const explorer = cosmiconfig('mini')
  explorer.search()
    .then((result) => {
      const finalResult = mergeConfig(result.config)
      console.log('%c [ finalResult ]-10', 'font-size:13px; background:pink; color:#bf2c9f;', finalResult)
      return finalResult
      // result.config is the parsed configuration object.
      // result.filepath is the path to the config file that was found.
      // result.isEmpty is true if there was nothing to parse in the config file.
    })
    .catch(() => {

    })
}

function mergeConfig (cfg) {
  return Object.assign(cfg, defaultConfig)
}
