import { Value } from '../../Cache'
export declare const REDIRECT: unique symbol
export declare const INDEX: unique symbol
export declare const GET_KEY: unique symbol
export declare const keyIsValid: (key: unknown) => boolean
export declare const keyIsEqual: (a: unknown, b: unknown) => boolean
export declare type RedirectHelpers = {
  instances: Set<Value>
  match(data: any): Value | undefined
  getByKey<TKey = unknown>(key: TKey): Value | undefined
}
export interface ProxyExtension<TData extends object = object> {
  [key: string]: any
  [REDIRECT]?(
    args: Record<string, any> | undefined,
    helpers: RedirectHelpers
  ): Value | undefined
  [GET_KEY]?(data: TData): any
}
export interface ArrayNodeExtension<TArray extends unknown[] = unknown[]>
  extends ProxyExtension<TArray> {
  [INDEX]?: NodeExtension<TArray[number]>
  [GET_KEY]?(data: TArray[number]): any
}
export declare type ObjectNodeExtension<
  TObject extends {} = {}
> = ProxyExtension<TObject> &
  {
    [K in keyof TObject]?: NodeExtension<TObject[K]>
  }
export declare type ScalarNodeExtension<TData extends unknown = unknown> = TData
export declare type UNodeExtension<TData = unknown> = TData extends object
  ? TData extends any[]
    ? ArrayNodeExtension<TData>
    : ObjectNodeExtension<TData>
  : ScalarNodeExtension<TData>
export declare type NodeExtension<TData = any> =
  | UNodeExtension<TData>
  | ((data: TData) => UNodeExtension<TData>)
