
const { cosmiconfig } = require('cosmiconfig')
const defaultConfig = require('./defaultConfig')

module.exports = function searchConfig () {
  const explorer = cosmiconfig('mini')

  explorer.search()
    .then((result) => {
      const finalResult = mergeConfig(result.config)
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
