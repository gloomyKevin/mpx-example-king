const colors = require('windicss/colors')
const typography = require('windicss/plugin/typography')
const { defaultPreset, createPreset } = require('mpx-tailwindcss-preset')

module.exports = {
  presets: [
    defaultPreset
    // createPreset({
    //   rem2rpx: false
    // })
  ]
}
