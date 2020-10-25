import { ArrayNode, DataContext } from '../Node'
import { Selection } from '../Selection'
import { Accessor } from './Accessor'
export declare class IndexAccessor<
  TSelectionArray extends Selection<ArrayNode<any>> = Selection<ArrayNode<any>>,
  TChildren extends Accessor = Accessor
> extends Accessor<TSelectionArray, TChildren> {
  parent: Accessor<TSelectionArray>
  index: number
  protected _resolved: boolean
  constructor(parent: Accessor<TSelectionArray>, index: number)
  protected initializeExtensions(): void
  getData(ctx?: DataContext): any
  toString(): string
}
