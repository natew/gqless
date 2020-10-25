import { ObjectNode } from '../ObjectNode'
import { DataTrait, DataContext } from '../traits'
export declare const getAbstractImplementation: (
  node: object,
  typename: string
) => any
export declare class Abstract<TNode extends ObjectNode = ObjectNode>
  implements DataTrait {
  implementations: TNode[]
  private abstractProxy
  protected abstractCtx: any
  constructor(implementations: TNode[])
  getData(ctx: DataContext): any
  toString(): string
}
