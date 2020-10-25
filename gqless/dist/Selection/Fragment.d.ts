import { Selection } from './Selection'
import { ObjectNode, InterfaceNode } from '../Node'
export declare type UFragment = ObjectNode | InterfaceNode
export declare class Fragment<
  TNode extends UFragment = UFragment
> extends Selection<TNode> {
  name?: string | undefined
  constructor(node: TNode, name?: string | undefined)
  toString(): string
}
