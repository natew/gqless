import { Formatter } from './Formatter'
import { Selection } from '../Selection'
import { SelectionTree } from './SelectionTree'
import { ObjectNode } from '../Node'
export declare const buildQuery: (
  { SPACE, SEPARATOR, NEWLINE, hug, indent, formatter }: Formatter,
  queryName?: string | undefined,
  ...selectionPaths: Selection<import('../Node').DataTrait>[][]
) => {
  rootTree: SelectionTree<Selection<ObjectNode>>
  query: string
  variables: Record<string, any> | undefined
}
export * from './SelectionTree'
