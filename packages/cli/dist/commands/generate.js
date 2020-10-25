'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const tslib_1 = require('tslib')
const command_1 = require('@oclif/command')
const got_1 = tslib_1.__importDefault(require('got'))
const path = tslib_1.__importStar(require('path'))
const generateSchema_1 = require('../utils/generateSchema')
const config_1 = require('../utils/config')
const utils_1 = require('@gqless/utils')
const headersArrayToObject = arr => {
  if (!arr) return
  return arr
    .map(val => JSON.parse(val))
    .reduce((pre, next) => Object.assign(Object.assign({}, pre), next), {})
}
class Generate extends command_1.Command {
  async run() {
    const config = await this.createConfig()
    const fetchQuery = async (query, variables) => {
      const response = await got_1.default.post(config.url, {
        headers: Object.assign(
          { 'Content-Type': 'application/json' },
          config.headers
        ),
        body: JSON.stringify({ query, variables }),
      })
      return JSON.parse(response.body)
    }
    await generateSchema_1.generateSchema(fetchQuery, config)
  }
  async createConfig() {
    const { args, flags } = this.parse(Generate)
    const { header } = flags,
      rest = tslib_1.__rest(flags, ['header'])
    let config
    try {
      config = (await config_1.getConfig(flags.config)) || {}
    } catch (error) {
      this.error(error.message)
    }
    Object.assign(config, rest)
    if (header) {
      config.headers = headersArrayToObject(header)
    }
    if (args.output_dir) {
      config.outputDir = args.output_dir
    }
    utils_1.invariant(
      config.outputDir,
      'The output directory is missing. You can pass it to the command or include it in the config file.'
    )
    config.outputDir = path.join(process.cwd(), config.outputDir)
    utils_1.invariant(
      config.url,
      'The url to the graphql endpoints is missing. You can use the -u flag or provide it in the config file.'
    )
    return config
  }
}
exports.default = Generate
Generate.description = 'Generate a client from a GraphQL endpoint'
Generate.examples = [
  `$ gqless generate ./src/gqless -u https://example.com/graphql`,
  `$ gqless generate -c gqless.config.ts`,
]
Generate.flags = {
  help: command_1.flags.help({ char: 'h' }),
  config: command_1.flags.string({
    char: 'c',
    description: 'Path to your gqless config file',
  }),
  header: command_1.flags.string({
    multiple: true,
    parse: header => {
      const separatorIndex = header.indexOf(':')
      const key = header.substring(0, separatorIndex).trim()
      const value = header.substring(separatorIndex + 1).trim()
      return JSON.stringify({ [key]: value })
    },
    description:
      'Additional header to send to server for introspectionQuery. May be used multiple times to add multiple headers.',
  }),
  comments: command_1.flags.boolean({
    description: `output comments to type definitions (useful for IDE intellisense)`,
    default: true,
  }),
  url: command_1.flags.string({
    char: 'u',
    description: 'url to the GraphQL endpoint',
  }),
  typescript: command_1.flags.boolean({
    char: 't',
    description: 'output typescript (instead of javascript)',
    default: true,
  }),
}
Generate.args = [{ name: 'output_dir' }]
//# sourceMappingURL=generate.js.map
