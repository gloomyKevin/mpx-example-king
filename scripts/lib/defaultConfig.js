/* 自定义配置 */
module.exports = {
  // 小程序文件目录
  miniprogramPath: '../dist/wx',
  // 'tailwindcss' 'windicss'
  classMode: 'windicss',
  // 样式生成策略
  cssMode: {
    mainPackage: true,
    subPackage: true,
    // TODO hack路径，待修改
    specSubPackage: ['subpackage1', 'subpackage2']
  },
  testKey: 1,
  // tailwind.config.js路径
  // 选填，没填写就cosmicconfig查找，没找到则使用默认
  configPath: ''
}
