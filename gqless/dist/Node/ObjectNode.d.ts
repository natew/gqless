import {
  FieldsNode,
  IFieldsNodeOptions,
  UFieldsNodeRecord,
  Matchable,
} from './abstract'
import { Value } from '../Cache'
import { ComputableExtension, StaticExtension } from './Extension'
import { DataTrait, DataContext } from './traits'
export declare type IObjectNodeOptions = IFieldsNodeOptions
declare const ObjectNode_base: import('mix-classes/dist/types').Mixin<[
  typeof FieldsNode,
  typeof Matchable
]>
export declare class ObjectNode extends ObjectNode_base implements DataTrait {
  extension?: ComputableExtension | StaticExtension
  constructor(fields: UFieldsNodeRecord, options: IObjectNodeOptions)
  match(value: Value, data: any): Value<DataTrait> | null | undefined
  getData(ctx: DataContext): any
}
export {}
