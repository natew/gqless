'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const tslib_1 = require('tslib')
const cosmiconfig_1 = require('cosmiconfig')
const cosmiconfig_typescript_loader_1 = tslib_1.__importDefault(
  require('@endemolshinegroup/cosmiconfig-typescript-loader')
)
const path_1 = require('path')
const utils_1 = require('@gqless/utils')
const MODULE_NAME = 'gqless'
const defaultFileNames = [
  'package.json',
  `${MODULE_NAME}.config.json`,
  `${MODULE_NAME}.config.yaml`,
  `${MODULE_NAME}.config.yml`,
  `${MODULE_NAME}.config.js`,
  `${MODULE_NAME}.config.ts`,
  // TODO deprecate
  `.${MODULE_NAME}rc.json`,
  `.${MODULE_NAME}rc.yaml`,
  `.${MODULE_NAME}rc.yml`,
]
const loaders = Object.assign(Object.assign({}, cosmiconfig_1.defaultLoaders), {
  '.ts': cosmiconfig_typescript_loader_1.default,
})
exports.getConfig = async path => {
  const configPath = path && path_1.parse(path_1.resolve(path)).dir
  const explorer = cosmiconfig_1.cosmiconfig(MODULE_NAME, {
    searchPlaces: path ? [path] : defaultFileNames,
    loaders,
  })
  let loadedConfig
  try {
    loadedConfig = await explorer.search(configPath)
  } catch (error) {
    throw new Error(`A config file failed to load: ${error}`)
  }
  utils_1.invariant(
    !(configPath && !loadedConfig),
    `A config file failed to load at ${configPath}. This is likely because this file is empty or malformed.`
  )
  return loadedConfig === null || loadedConfig === void 0
    ? void 0
    : loadedConfig.config
}
//# sourceMappingURL=config.js.map
