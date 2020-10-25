import { Arguments } from '../../Arguments'
import { FieldSelection } from '../../../Selection'
import { NodeContainer } from '../NodeContainer'
import { FieldsNode } from './FieldsNode'
import { DataTrait, DataContext } from '../../traits'
export declare class FieldNode<TNode extends DataTrait = DataTrait>
  extends NodeContainer<TNode>
  implements DataTrait {
  args?: Arguments | undefined
  name: string
  constructor(node: TNode, args?: Arguments | undefined, nullable?: boolean)
  get uncallable(): boolean
  getSelection(
    ctx: DataContext,
    args?: Record<string, any>
  ): FieldSelection<TNode>
  getData(ctx: DataContext<FieldsNode & DataTrait>): any
  toString(): string
}
