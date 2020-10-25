'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const tslib_1 = require('tslib')
const schema_1 = require('@gqless/schema')
const fs = tslib_1.__importStar(require('fs'))
const prettier = tslib_1.__importStar(require('prettier'))
const mkdirp = tslib_1.__importStar(require('mkdirp'))
const path = tslib_1.__importStar(require('path'))
exports.generateSchema = async (fetchQuery, options) => {
  const schema = await schema_1.fetchSchema(fetchQuery, {
    includeInfo: options.comments,
  })
  const codegen = new schema_1.Codegen(schema, {
    typescript: options.typescript,
    url: options.url,
    headers: options.headers,
  })
  const files = codegen.generate()
  const prettierConfig = await prettier.resolveConfig(options.outputDir)
  for (const file of files) {
    const filePath = path.join(options.outputDir, file.path)
    mkdirp.sync(path.dirname(filePath))
    if (!file.overwrite && fs.existsSync(filePath)) continue
    const source = prettier.format(
      file.contents,
      Object.assign(Object.assign({}, prettierConfig), { parser: 'typescript' })
    )
    fs.writeFileSync(filePath, source)
  }
}
//# sourceMappingURL=generateSchema.js.map
