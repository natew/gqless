import { SelectionTree } from './SelectionTree'
import { Formatter } from './Formatter'
export declare const buildFragments: (
  { SPACE, NEWLINE, hug, indent, formatter }: Formatter,
  tree: SelectionTree<import('../Selection').Selection<import('..').DataTrait>>
) => string
