import {
  FieldNode,
  EnumNode,
  InputNode,
  InputNodeField,
  ScalarNode,
  UnionNode,
  InterfaceNode,
  ObjectNode,
  ArrayNode,
  Arguments,
  ArgumentsField,
} from 'gqless'

const CORE = 'gqless'
const UTILS = '@gqless/utils'
class File {
  constructor(path, overwrite = true) {
    this.path = path
    this.overwrite = overwrite
    this.imports = new Map()
    this.importAlls = new Map()
  }

  import(from, ...imports) {
    if (!this.imports.has(from)) this.imports.set(from, new Set())
    const importsSet = this.imports.get(from)
    imports.forEach(imp => importsSet.add(imp))
  }

  importAll(from, as) {
    if (this.importAlls.has(from)) {
      const existingName = this.importAlls.get(from)
      if (existingName !== as)
        throw new Error(
          `Already imported all from ${from}, use ${existingName} instead of ${as}`
        )
      return
    }

    this.importAlls.set(from, as)
  }

  generate() {
    return [
      ...Array.from(this.importAlls.entries()).map(
        ([from, as]) => `import * as ${as} from '${from}'`
      ),
      ...Array.from(this.imports.entries()).map(([from, imports]) =>
        imports.size
          ? `import { ${Array.from(imports).join(',')} } from '${from}'`
          : ''
      ),
    ].join('\n')
  }
}

const SCHEMA_VAR = 'schema'
class SchemaFile extends File {
  constructor(codegen) {
    super('generated/schema')
    this.codegen = codegen
  }

  generate() {
    this.importAll(`../extensions`, 'extensions')
    this.import(UTILS, 'lazyGetters')
    const body = `
      export const ${SCHEMA_VAR} = ${this.generateSchema()}

      lazyGetters(${SCHEMA_VAR})
    `
    return `
      // @ts-nocheck
      ${super.generate()}

      ${body}
    `
  }

  generateSchema() {
    return `{
      ${Object.values(this.codegen.schema.types)
        .map(
          type => `get ${type.name}() {
            return ${this.generateNode(type)}
          }`
        )
        .join(',')}
    }`
  }

  getNode(name) {
    return `${SCHEMA_VAR}.${name}`
  }

  getExtension(name) {
    if (this.codegen.options.typescript) {
      return `(extensions as any || {}).${name}`
    } // || {} is used to confuse webpack which displays errors if you don't export an extension

    return `(extensions || {}).${name}`
  }

  generateFieldGetter(field) {
    this.import(CORE, FieldNode.name)
    return `get ${field.name}() {
      return new ${FieldNode.name}(${this.generateType(
      field.type
    )}, ${this.generateArguments(field.args)}, ${field.type.nullable})
    }`
  }

  generateNode(type) {
    switch (type.kind) {
      case 'OBJECT': {
        this.import(CORE, ObjectNode.name)
        return `new ${ObjectNode.name}({
          ${Object.values(type.fields)
            .map(field => this.generateFieldGetter(field))
            .join(',')}
        }, { name: ${JSON.stringify(type.name)}, extension: ${this.getExtension(
          type.name
        )} })`
      }

      case 'INTERFACE': {
        this.import(CORE, InterfaceNode.name)
        return `new ${InterfaceNode.name}({
          ${Object.values(type.fields)
            .map(field => this.generateFieldGetter(field))
            .join(',')}
        },
        [${type.possibleTypes.map(type => this.getNode(type)).join(',')}],
        { name: ${JSON.stringify(type.name)}, extension: ${this.getExtension(
          type.name
        )} })`
      }

      case 'UNION': {
        this.import(CORE, UnionNode.name)
        return `new ${UnionNode.name}([${type.possibleTypes.map(type =>
          this.getNode(type)
        )}])`
      }

      case 'SCALAR': {
        this.import(CORE, ScalarNode.name)
        return `new ${ScalarNode.name}({ name: ${JSON.stringify(
          type.name
        )}, extension: ${this.getExtension(type.name)} })`
      }

      case 'INPUT_OBJECT': {
        this.import(CORE, InputNode.name)
        return `new ${InputNode.name}({
          ${Object.values(type.inputFields)
            .map(field => {
              this.import(CORE, InputNodeField.name)
              return `get ${field.name}() {
                return new ${InputNodeField.name}(${this.generateType(
                field.type
              )}, ${field.type.nullable})
              }`
            })
            .join(',')}
        }, ${JSON.stringify({
          name: type.name,
        })})`
      }

      case 'ENUM': {
        this.import(CORE, EnumNode.name)
        return `new ${EnumNode.name}({ name: ${JSON.stringify(type.name)} })`
      }
    }

    return undefined
  }

  generateType(type) {
    this.import(CORE, ArrayNode.name)

    if (type.kind === 'LIST') {
      return `new ${ArrayNode.name}(${this.generateType(type.ofType)}, ${
        type.nullable
      })`
    }

    return this.getNode(type.name)
  }

  generateArguments(args) {
    if (!args) return undefined
    this.import(CORE, Arguments.name)
    const argsRequired = !Object.values(args).find(arg => arg.nullable)
      ? ', true'
      : ''
    return `new ${Arguments.name}({
      ${Object.entries(args)
        .map(([name, type]) => {
          this.import(CORE, ArgumentsField.name)
          return `get ${name}() {
            return new ${ArgumentsField.name}(${this.generateType(type)}, ${
            type.nullable
          })}`
        })
        .join(',')}
    }${argsRequired})`
  }
}

const TYPE_PREFIX = 't_'
class TypesFile extends File {
  constructor(codegen) {
    super('generated/types')
    this.codegen = codegen
    this.typeNames = this.createUniqueNames(
      Object.keys(this.codegen.schema.types),
      Object.keys(this.codegen.schema.types),
      name => {
        return `${TYPE_PREFIX}${name}`
      }
    )
    this.names = this.createUniqueNames(
      [
        ...Object.keys(this.codegen.schema.types),
        ...Object.values(this.typeNames),
      ],
      [
        'Extension',
        'EnumType',
        'FieldsType',
        'FieldsTypeArg',
        'ScalarType',
        'TypeData',
        'extensions',
      ],
      name => `gqless_${name}`
    )

    this.typeReference = name => {
      const schemaType = this.codegen.getSchemaType(name)
      if (schemaType.kind === 'INPUT_OBJECT') return name
      return this.typeNames[name]
    }

    this.typeValue = name => {
      const type = this.codegen.getSchemaType(name)

      if (type.kind === 'SCALAR') {
        return this.defaultScalarType(type)
      }

      return type.name
    }
  }

  createUniqueNames(reservedNames, names, makeUnique) {
    const namesObj = {}

    const uniqueName = desiredName => {
      if (reservedNames.includes(desiredName))
        return uniqueName(makeUnique(desiredName))
      return desiredName
    }

    for (const name of names) {
      const chosenName = uniqueName(name)
      reservedNames.push(chosenName)
      namesObj[name] = chosenName
    }

    return namesObj
  }

  generate() {
    this.import(CORE, this.names.TypeData)
    this.importAll('../extensions', this.names.extensions)
    const body = Object.values(this.codegen.schema.types)
      .map(type => {
        const definition = this.generateSchemaType(type)
        if (!definition) return
        return this.generateComments(this.schemaTypeComments(type)) + definition
      })
      .filter(Boolean)
      .join('\n\n')
    return `
      ${super.generate()}

      type ${
        this.names.Extension
      }<TName extends string> = TName extends keyof typeof ${
      this.names.extensions
    }
        ? typeof ${this.names.extensions}[TName]
        : any

      ${body}

      ${Object.values(this.codegen.schema.types)
        .filter(type => type.kind !== 'INPUT_OBJECT')
        .map(type =>
          type.kind === 'ENUM'
            ? `${this.generateComments(
                this.schemaTypeComments(type)
              )}export enum ${type.name} { \n
          ${type.enumValues.map(k => `${k} = '${k}' \n`)}
          }`
            : `${this.generateComments(
                this.schemaTypeComments(type)
              )}export type ${type.name} = ${
                this.names.TypeData
              }<${this.typeReference(type.name)}>`
        )
        .join('\n')}
    `
  }

  schemaTypeComments(type) {
    const comments = [`@name ${type.name}`, `@type ${type.kind}`]

    if (type.kind === 'OBJECT' && type.interfaces.length) {
      comments.push(`@implements ${type.interfaces.join(', ')}`)
    }

    return comments
  }

  generateComments(comments) {
    if (comments.length)
      return (
        `\n` +
        `/**\n` +
        ` * ${comments.join('\n* ').replace(/\*\//gm, '*\u200B/')}\n` +
        ` */\n`
      )
    return ''
  }

  generateFieldComments(field) {
    const comments = []

    if (field.isDeprecated) {
      comments.push(
        `@deprecated${
          field.deprecationReason
            ? ` ${field.deprecationReason.replace(/\n/gm, ' ')}`
            : ''
        }`
      )
    }

    if (field.description) {
      comments.push(...field.description.split('\n'))
    }

    return this.generateComments(comments)
  }

  generateSchemaType(type) {
    switch (type.kind) {
      case 'SCALAR':
        return this.generateScalarType(type)

      case 'UNION':
      case 'INTERFACE':
        return `type ${this.typeReference(
          type.name
        )} = ${type.possibleTypes
          .map(name => this.typeReference(name))
          .join(' | ')}`

      case 'OBJECT': {
        this.import(CORE, this.names.FieldsType)
        return `type ${this.typeReference(type.name)} = ${
          this.names.FieldsType
        }<{\n${[
          `__typename: ${this.typeReference('String')}<'${type.name}'>`,
          ...Object.values(type.fields).map(field => this.generateField(field)),
        ].join('\n')}\n}, ${this.names.Extension}<'${type.name}'>>`
      }

      case 'INPUT_OBJECT':
        return `export type ${this.typeReference(type.name)} = {${Object.values(
          type.inputFields
        )
          .map(field => this.generateField(field, this.typeValue))
          .join('\n')}}`

      case 'ENUM': {
        this.import(CORE, this.names.EnumType)
        return `type ${this.typeReference(type.name)} = ${
          this.names.EnumType
        }<${type.enumValues.map(value => `'${value}'`).join(' | ')}>`
      }

      default:
        return
    }
  }

  generateArgs(args) {
    return `{${Object.entries(args)
      .map(([name, type]) => {
        const NULLABLE = type.nullable ? '?' : ''
        return `${name}${NULLABLE}: ${this.generateType(type, this.typeValue)}`
      })
      .join(',')}}`
  }

  generateField(field, resolveType) {
    const NULLABLE = field.type.nullable ? '?' : ''
    const fieldType = this.generateType(field.type, resolveType)
    if (field.args) this.import(CORE, this.names.FieldsTypeArg)
    return `${this.generateFieldComments(field)}${field.name} ${
      field.args
        ? `: ${this.names.FieldsTypeArg}<${this.generateArgs(
            field.args
          )}, ${fieldType}>`
        : `${NULLABLE}: ${fieldType}`
    }`
  }

  generateType(type, resolveType = this.typeReference) {
    const nullType = type.nullable ? '| null' : ''

    switch (type.kind) {
      case 'OBJECT':
      case 'ENUM':
      case 'INPUT_OBJECT':
      case 'UNION':
      case 'INTERFACE':
      case 'SCALAR':
        return `${resolveType(type.name)}${nullType}`

      case 'LIST':
        return `(${this.generateType(type.ofType, resolveType)})[]${nullType}`

      default:
        return 'any'
    }
  }

  defaultScalarType(scalar) {
    switch (scalar.name) {
      case 'ID':
      case 'String':
      case 'Date':
      case 'URI':
        return `string`

      case 'Int':
      case 'Float':
        return `number`

      case 'Boolean':
        return `boolean`

      case 'JSON':
        return `{ [K: string]: any }`
    }

    return 'any'
  }

  generateScalarType(scalar) {
    this.import(CORE, this.names.ScalarType)
    const type = this.defaultScalarType(scalar)
    return `type ${this.typeReference(
      scalar.name
    )}<T extends ${type} = ${type}> = ${this.names.ScalarType}<T, ${
      this.names.Extension
    }<'${scalar.name}'>>`
  }
}

class IndexFile extends File {
  constructor() {
    super('generated/index')
  }

  generate() {
    return `
      ${super.generate()}

      export * from './schema'
      export * from './types'
    `
  }
}

class ExtensionsFile extends File {
  constructor(codegen) {
    super('extensions/index', false)
    this.codegen = codegen
  }

  generate() {
    // TODO: default keys
    return `
      ${super.generate()}

      export const Query = {}

      /**
       * Add a key to a type
       */
      // export const User = {
      //   [GET_KEY]: (user) => user.id
      // }

      /**
       * Add custom data to a type
       * @example
       * query.users[0].follow()
       */
      // export const User = (user) => ({
      //   follow() {
      //     console.log('follow', user.id)
      //   }
      // })
    `
  }
}

class ClientFile extends File {
  constructor(codegen) {
    super('client', false)
    this.codegen = codegen
  }

  generate() {
    this.import(CORE, 'Client', 'QueryFetcher')
    this.import('./generated', 'schema', this.codegen.schema.queryType)
    return `
      ${super.generate()}

      const endpoint = ${JSON.stringify(this.codegen.options.url || '')}

      const fetchQuery: QueryFetcher = async (query, variables) => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',${
              this.codegen.options.headers
                ? Object.entries(this.codegen.options.headers)
                    .map(([key, value]) => `'${key}': '${value}'`)
                    .join('\n')
                : ''
            }
          },
          body: JSON.stringify({
            query,
            variables,
          }),
          mode: 'cors',
        })

        if (!response.ok) {
          throw new Error(\`Network error, received status code $\{response.status}\`)
        }

        const json = await response.json()

        return json
      }

      export const client = new Client<${
        this.codegen.schema.queryType
      }>(schema.${this.codegen.schema.queryType}, fetchQuery)

      export const query = client.query
    `
  }
}

class IndexFile$1 extends File {
  constructor() {
    super('index')
  }

  generate() {
    return `
      ${super.generate()}

      export * from './generated'
      export * from './client'
    `
  }
}

class Codegen {
  constructor(schema, options) {
    this.schema = schema
    this.options = {
      typescript: true,
      ...options,
    }
    this.files = [
      new ExtensionsFile(this),
      new IndexFile$1(),
      new SchemaFile(this),
      new ClientFile(this),
      new TypesFile(this),
      new IndexFile(),
    ]
  }

  getSchemaType(name) {
    return this.schema.types[name]
  }

  generate() {
    return this.files.map(file => ({
      path: `${file.path}.${this.options.typescript ? 'ts' : 'js'}`,
      overwrite: file.overwrite,
      contents: file.generate(),
    }))
  }
}

const gql = String.raw
const introspectionQuery = (includeInfo = false) => gql`
  query IntrospectionQuery {
    __schema {
      queryType {
        name
      }
      mutationType {
        name
      }
      types {
        ...FullType
      }
    }
  }

  fragment FullType on __Type {
    kind
    name
    fields(includeDeprecated: true) {
      ${
        includeInfo
          ? `
      description
      isDeprecated
      deprecationReason
      `
          : ''
      }
      name
      args {
        type {
          ...TypeRef
        }
        ...InputValue
      }
      type {
        ...TypeRef
      }
    }
    enumValues {
      name
    }
    inputFields {
      type {
        ...TypeRef
      }
      ...InputValue
    }
    interfaces {
      ...TypeRef
    }
    possibleTypes {
      ...TypeRef
    }
  }

  fragment InputValue on __InputValue {
    name
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

const getType = (type, nullable = true) => {
  if (!type) return null
  if (type.kind === 'NON_NULL') return getType(type.ofType, false)
  return {
    kind: type.kind,
    nullable,
    ...(type.kind === 'LIST'
      ? {
          ofType: getType(type.ofType),
        }
      : {
          name: type.name,
        }),
  }
}

const getFields = introspectionFields => {
  const fields = {}

  for (const field of introspectionFields) {
    let args = undefined

    if (field.args.length) {
      args = {}
      field.args.forEach(arg => {
        args[arg.name] = getType(arg.type)
      })
    }

    fields[field.name] = {
      name: field.name,
      deprecationReason: field.deprecationReason,
      description: field.description,
      isDeprecated: field.isDeprecated,
      args,
      type: getType(field.type),
    }
  }

  return fields
}

const getInputObjectFields = introspectionFields => {
  const fields = {}

  for (const field of introspectionFields) {
    fields[field.name] = {
      name: field.name,
      type: getType(field.type),
    }
  }

  return fields
}

const getInterfaces = interfaces =>
  interfaces.map(_interface => _interface.name)

const getEnumValues = enumValues =>
  enumValues.map(enumValues => enumValues.name)

const introspectionToSchema = introspection => {
  const schema = {
    queryType: introspection.queryType.name,
    mutationType: introspection.mutationType && introspection.mutationType.name,
    types: {},
  }

  for (const type of introspection.types) {
    schema.types[type.name] = {
      name: type.name,
      kind: type.kind,
      ...(type.kind === 'UNION'
        ? {
            possibleTypes: type.possibleTypes.map(({ name }) => name),
          }
        : type.kind === 'INTERFACE'
        ? {
            possibleTypes: type.possibleTypes.map(({ name }) => name),
            fields: getFields(type.fields),
          }
        : type.kind === 'OBJECT'
        ? {
            fields: getFields(type.fields),
            interfaces: getInterfaces(type.interfaces),
          }
        : type.kind === 'INPUT_OBJECT'
        ? {
            inputFields: getInputObjectFields(type.inputFields),
          }
        : type.kind === 'ENUM'
        ? {
            enumValues: getEnumValues(type.enumValues),
          }
        : null),
    }
  }

  return schema
}

const fetchSchema = function(fetchQuery, { includeInfo } = {}) {
  try {
    return Promise.resolve(fetchQuery(introspectionQuery(includeInfo))).then(
      function({ data }) {
        return introspectionToSchema(data.__schema)
      }
    )
  } catch (e) {
    return Promise.reject(e)
  }
}

export { Codegen, fetchSchema }
//# sourceMappingURL=schema.esm.js.map
