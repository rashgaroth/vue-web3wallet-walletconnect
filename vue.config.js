const { defineConfig } = require('@vue/cli-service')
const { ProvidePlugin } = require('webpack')

/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: (config) => {
    config.plugins.push(
      new ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    )
    config.plugins.push(
      new ProvidePlugin({
        process: 'process/browser',
      })
    )
  }
})
