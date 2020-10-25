import { NodeContainer, Matchable } from './abstract'
import { Value } from '../Cache'
import { DataTrait, DataContext } from './traits'
export interface ArrayNode<TNode extends object = object>
  extends NodeContainer<TNode> {}
declare const ArrayNode_base: import('mix-classes/dist/types').Mixin<[
  import('mix-classes').IGeneric<typeof NodeContainer>,
  typeof Matchable
]>
export declare class ArrayNode<TNode> extends ArrayNode_base
  implements DataTrait {
  constructor(ofNode: TNode, nullable?: boolean)
  match(value: Value, data: any): Value<DataTrait> | null | undefined
  getData(ctx: DataContext<ArrayNode<TNode>>): any[]
  toString(): string
}
export {}
