import { Schema } from '../Schema'
import { File } from './File'
interface CodegenOptions {
  url?: string
  typescript?: boolean
  headers?: Record<string, string>
}
export declare class Codegen {
  schema: Schema
  options: CodegenOptions
  files: File[]
  constructor(schema: Schema, options?: CodegenOptions)
  getSchemaType(name: string): import('../Schema').SchemaType
  generate(): {
    path: string
    overwrite: boolean
    contents: string
  }[]
}
export {}
