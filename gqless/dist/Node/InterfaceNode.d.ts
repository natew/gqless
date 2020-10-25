import {
  FieldsNode,
  IFieldsNodeOptions,
  Abstract,
  UFieldsNodeRecord,
} from './abstract'
import {
  NodeExtension,
  StaticExtension,
  ComputableExtension,
} from './Extension'
import { ObjectNode } from './ObjectNode'
import { DataTrait, DataContext } from './traits'
export declare type IInterfaceNodeOptions = IFieldsNodeOptions & {
  extension?: NodeExtension
}
export interface InterfaceNode<TImplementation extends ObjectNode = ObjectNode>
  extends Abstract<TImplementation> {}
declare const InterfaceNode_base: import('mix-classes/dist/types').Mixin<[
  typeof FieldsNode,
  import('mix-classes').IGeneric<typeof Abstract>
]>
export declare class InterfaceNode<TImplementation> extends InterfaceNode_base
  implements DataTrait {
  extension?: StaticExtension | ComputableExtension
  constructor(
    fields: UFieldsNodeRecord,
    implementations: TImplementation[],
    options: IInterfaceNodeOptions
  )
  getData(ctx: DataContext): any
  toString(): string
}
export {}
