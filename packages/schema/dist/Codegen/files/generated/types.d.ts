import { File } from '../../File'
import { Codegen } from '../../Codegen'
import { SchemaType, SchemaField, Type, SchemaFieldArgs } from '../../../Schema'
declare type TypeResolver = (name: string) => string
export declare class TypesFile extends File {
  private codegen
  constructor(codegen: Codegen)
  private createUniqueNames
  private typeNames
  private names
  private typeReference
  private typeValue
  generate(): string
  private schemaTypeComments
  private generateComments
  private generateFieldComments
  generateSchemaType(type: SchemaType): string | undefined
  generateArgs(args: SchemaFieldArgs): string
  generateField(field: SchemaField, resolveType?: TypeResolver): string
  generateType(type: Type, resolveType?: (name: string) => string): string
  defaultScalarType(
    scalar: SchemaType
  ): 'string' | 'number' | 'boolean' | '{ [K: string]: any }' | 'any'
  generateScalarType(scalar: SchemaType): string
}
export {}
