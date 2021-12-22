module.exports = {
  plugins: [
    require('autoprefixer')({ remove: false }),
    require('tailwindcss')({ config: './tailwind.config.js' })
  ]
}
