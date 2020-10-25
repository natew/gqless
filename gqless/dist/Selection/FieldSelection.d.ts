import { FieldNode, DataTrait } from '../Node'
import { Selection } from './Selection'
export declare class FieldSelection<
  TNode extends DataTrait = DataTrait
> extends Selection<TNode> {
  field: FieldNode<TNode>
  readonly args?: Record<string, any> | undefined
  constructor(field: FieldNode<TNode>, args?: Record<string, any> | undefined)
  toString(): string
}
