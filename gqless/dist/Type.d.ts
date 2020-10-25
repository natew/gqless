import {
  Tuple,
  UnshiftTuple,
  MapTupleByKey,
  LastTupleValue,
  LastTupleValueForKey,
  TupleKeys,
} from '@gqless/utils'
import { Variable } from './Variable'
import { INDEX, GET_KEY } from './Node'
declare type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends {
    [P in K]: T[K]
  }
    ? never
    : K
}[keyof T]
declare type UnionToIntersection<U> = (U extends any
? (k: U) => void
: never) extends (k: infer I) => void
  ? I
  : never
declare type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N
declare enum Kind {
  scalar = 0,
  enum = 1,
  fields = 2,
}
declare type Type<TKind extends Kind = any, TData = any, TExtension = any> = {
  kind: TKind
  data: TData
  extension: TExtension
}
declare type ExtensionData<TExtension> = TExtension extends (
  ...args: any[]
) => infer U
  ? U
  : TExtension
declare type TypeExtension<TType extends ValidType> = TType extends Type
  ? IfAny<TType['extension'], never, ExtensionData<TType['extension']>>
  : never
declare type ValidType = ValidType[] | Type | undefined | null
export declare type ScalarType<TData = any, TExtension = any> = Type<
  Kind.scalar,
  TData,
  TExtension
>
export declare type EnumType<TData = any, TExtension = any> = Type<
  Kind.enum,
  TData,
  TExtension
>
declare type FieldsRecord = Record<string, ValidType | FieldsTypeArg>
export declare type FieldsType<
  TData extends FieldsRecord = any,
  TExtension = any
> = Type<Kind.fields, TData, TExtension>
declare type ArgsRecord = Record<string, any>
export declare type FieldsTypeArg<
  TArgs extends ArgsRecord = any,
  TType extends ValidType = any
> = {
  ofType: TType
  args: TArgs
}
declare type WithVariables<TArgs extends ArgsRecord> = TArgs extends object
  ? {
      [K in keyof TArgs]:
        | WithVariables<TArgs[K]>
        | Variable<WithVariables<Exclude<TArgs[K], undefined>>>
    }
  : TArgs
declare type ArgsFn<
  TArgs extends ArgsRecord,
  TType extends ValidType,
  TExtension
> = RequiredKeys<TArgs> extends never
  ? ((args?: TArgs) => TypeData<TType, TExtension>) &
      (TType extends ScalarType | EnumType
        ? unknown
        : TypeData<TType, TExtension>)
  : (args: TArgs) => TypeData<TType, TExtension>
declare type MapExtensionData<T extends Tuple, Key extends TupleKeys<T>> = {
  [K in keyof MapTupleByKey<T, Key>]: ExtensionData<MapTupleByKey<T, Key>[K]>
}
declare type CustomExtensionData<
  TExtensions extends Tuple
> = keyof TExtensions extends never
  ? {}
  : UnionToIntersection<TExtensions[keyof TExtensions]> extends infer U
  ? Omit<
      {
        [K in keyof U]: U[K] extends never
          ? LastTupleValueForKey<TExtensions, K>
          : U[K]
      },
      typeof INDEX | typeof GET_KEY
    >
  : never
declare type FieldsData<
  TFields extends FieldsType,
  TExtensions extends Tuple
> = keyof TFields['data'] extends never
  ? CustomExtensionData<TExtensions>
  : {
      [K in keyof (TFields['data'] &
        CustomExtensionData<TExtensions>)]: K extends keyof TFields['data']
        ? TFields['data'][K] extends FieldsTypeArg<infer TArgs, infer TType>
          ? ArgsFn<
              WithVariables<TArgs>,
              TType,
              MapExtensionData<TExtensions, K>
            >
          : TypeData<TFields['data'][K], MapExtensionData<TExtensions, K>>
        : CustomExtensionData<TExtensions>[K]
    }
declare type ArrayData<
  TArray extends ValidType[],
  TExtensions extends Tuple
> = {
  [K in keyof TArray]: TArray[K] extends ValidType
    ? TypeData<TArray[K], MapExtensionData<TExtensions, typeof INDEX>>
    : TArray[K]
} &
  (CustomExtensionData<TExtensions> extends infer U
    ? keyof U extends never
      ? unknown
      : {
          [K in keyof U]: U[K]
        }
    : never)
declare type ScalarData<
  TScalar extends ScalarType | EnumType,
  TExtensions extends Tuple
> = LastTupleValue<TExtensions> extends never
  ? TScalar['data']
  : LastTupleValue<TExtensions>
declare type UnshiftExtension<
  TExtensions,
  TType extends ValidType
> = keyof TypeExtension<TType> extends never
  ? TExtensions
  : UnshiftTuple<TExtensions, TypeExtension<TType>>
export declare type TypeData<
  TType extends ValidType,
  TExtensions extends Tuple = {}
> = TType extends Array<any>
  ? ArrayData<TType, UnshiftExtension<TExtensions, TType>>
  : TType extends ScalarType | EnumType
  ? ScalarData<TType, UnshiftExtension<TExtensions, TType>>
  : TType extends FieldsType
  ? FieldsData<TType, UnshiftExtension<TExtensions, TType>>
  : null
export {}
