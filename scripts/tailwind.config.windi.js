const { defaultPreset, createPreset } = require('mpx-tailwindcss-preset')
let subpackageContent
function createContent (content) {
  subpackageContent = content
}

module.exports = {
  presets: [
    defaultPreset,
    createPreset({
      rem2rpx: false
    })
  ],
  // content: [subpackageContent],
  content: ['./dist/wx/subpackage2/**/*.wxml'],
  createContent
}
