import { SelectionTree } from './SelectionTree'
import { Formatter } from './Formatter'
import { Variables } from './buildVariable'
export declare const buildSelections: (
  { LINE_SEPARATOR, formatter }: Formatter,
  tree: SelectionTree<
    import('../Selection').Selection<import('../Node').DataTrait>
  >,
  variables?: Variables | undefined
) => string
export declare const buildSelectionTree: (
  { formatter }: Formatter,
  tree: SelectionTree<
    import('../Selection').Selection<import('../Node').DataTrait>
  >,
  variables?: Variables | undefined
) => string
