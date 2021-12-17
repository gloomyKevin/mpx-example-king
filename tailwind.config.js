const { defaultPreset, createPreset } = require('mpx-tailwindcss-preset')
module.exports = {
  presets: [
    defaultPreset,
    createPreset({
      rem2rpx: false
    })]
}
