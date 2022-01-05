const { cosmiconfig } = require('cosmiconfig')

async function loadMIniCfg () {
  let res = await cosmiconfig('mini').load('../')
  console.log('%c [ res ]-5', 'font-size:13px; background:pink; color:#bf2c9f;', res)
}
loadMIniCfg()
