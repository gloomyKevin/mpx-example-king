// import { myConfig } from './bridge'
const { myConfig } = require('./bridge')
const { defaultPreset, createPreset } = require('mpx-tailwindcss-preset')
console.log('myConfig', myConfig)
const res = Object.assign(
  {
    presets: [
      defaultPreset,
      createPreset({
        rem2rpx: false
      })
    ]
  },
  myConfig)
console.log(res)
module.exports = res
// export { res }
