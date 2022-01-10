/* 自定义配置 */
module.exports = {
  // 小程序文件目录
  // TODO 此处有问题，为hack路径，待修改
  miniprogramPath: '../dist/wx',
  // 'tailwindcss' 'windicss'
  classMode: 'tailwindcss',
  // 样式生成策略
  cssMode: {
    mainPackage: true,
    subPackage: true,
    specSubPackage: []
  },
  // 以下为可选，合并策略待定
  configPath: ''
}
