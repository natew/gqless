import { SchemaFieldArgs } from '../../../Schema'
import { File } from '../../File'
import { Codegen } from '../../Codegen'
export declare const SCHEMA_VAR = 'schema'
export declare class SchemaFile extends File {
  private codegen
  constructor(codegen: Codegen)
  generate(): string
  private generateSchema
  private getNode
  private getExtension
  private generateFieldGetter
  private generateNode
  private generateType
  generateArguments(args?: SchemaFieldArgs): string | undefined
}
