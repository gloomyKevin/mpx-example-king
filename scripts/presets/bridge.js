// let myConfig = {}
let myConfig

function createFinalPreset (cliConfig) {
  myConfig = cliConfig
  console.log('config2', cliConfig)
  // console.log(cliConfig)
  return cliConfig
}

module.exports = {
  createFinalPreset,
  myConfig
}
// export {
//   createFinalPreset,
//   myConfig
// }
