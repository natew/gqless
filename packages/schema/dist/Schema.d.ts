declare type ObjectKind = 'OBJECT'
declare type InterfaceKind = 'INTERFACE'
declare type ScalarKind = 'SCALAR'
declare type ListKind = 'LIST'
declare type UnionKind = 'UNION'
declare type EnumKind = 'ENUM'
declare type InputObjectKind = 'INPUT_OBJECT'
export declare type SchemaKind =
  | ListKind
  | ObjectKind
  | ScalarKind
  | InterfaceKind
  | UnionKind
  | EnumKind
  | InputObjectKind
export interface Schema<T = any> {
  queryType: string
  mutationType?: string
  types: {
    [key in keyof T]: SchemaType
  }
}
interface BaseSchemaType<TKind extends SchemaKind> {
  kind: TKind
  name: string
}
export declare type SchemaFields = Record<string, SchemaField>
export declare type SchemaEnumType = BaseSchemaType<EnumKind> & {
  enumValues: string[]
}
export declare type SchemaObjectType = BaseSchemaType<ObjectKind> & {
  fields: SchemaFields
  interfaces: string[]
}
export declare type SchemaInterfaceType = BaseSchemaType<InterfaceKind> & {
  possibleTypes: string[]
  fields: SchemaFields
}
export declare type SchemaUnionType = BaseSchemaType<UnionKind> & {
  possibleTypes: string[]
}
export declare type SchemaInputFields = Record<string, SchemaInputField>
export declare type SchemaInputType = BaseSchemaType<InputObjectKind> & {
  inputFields: SchemaInputFields
}
export declare type SchemaType =
  | SchemaEnumType
  | SchemaObjectType
  | SchemaUnionType
  | SchemaInterfaceType
  | SchemaInputType
  | BaseSchemaType<
      Exclude<
        SchemaKind,
        ObjectKind | InterfaceKind | UnionKind | InputObjectKind | EnumKind
      >
    >
export declare type SchemaFieldArgs = Record<string, Type>
export interface SchemaField {
  name: string
  type: Type
  args?: SchemaFieldArgs
  description?: string
  isDeprecated?: boolean
  deprecationReason?: string
}
export interface SchemaInputField {
  name: string
  type: Type
}
declare type BaseType<TKind extends SchemaKind> = {
  kind: TKind
  nullable: boolean
}
export declare type ListType = BaseType<ListKind> & {
  ofType: Type
}
export declare type ObjectType = BaseType<Exclude<SchemaKind, ListKind>> & {
  name: string
}
export declare type Type = ListType | ObjectType
export {}
