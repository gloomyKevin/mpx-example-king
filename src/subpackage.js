function getConfig () {
  const config = {
    pages: [
      './pages/mainpage1/index',
      './pages/mainpage2/index'
    ],
    packages: [
      './subpackage/subpackage1/app.mpx?root=subpackage1',
      './subpackage/subpackage2/app.mpx?root=subpackage2'
    ]
  }
  return config
}
module.exports = getConfig
