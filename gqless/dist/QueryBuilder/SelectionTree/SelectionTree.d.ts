import { Selection, Fragment } from '../../Selection'
import { resolveAliases } from './resolveAliases'
export declare class SelectionTree<TSelection extends Selection = Selection> {
  selection: TSelection
  parent?: SelectionTree<Selection<import('../..').DataTrait>> | undefined
  duplicatedFragments: Map<string, SelectionTree<Fragment>>
  allFragments: WeakMap<Fragment, string | undefined>
  children: SelectionTree[]
  constructor(
    selection: TSelection,
    parent?: SelectionTree<Selection<import('../..').DataTrait>> | undefined
  )
  private getExistingTree
  resolveAliases: typeof resolveAliases
  get path(): SelectionTree<any>[]
  get alias(): string | undefined
  get key(): string | undefined
  toString(): string
}
