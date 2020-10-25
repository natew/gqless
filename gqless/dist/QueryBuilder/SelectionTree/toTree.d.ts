import { Selection } from '../../Selection'
import { SelectionTree } from './SelectionTree'
export declare const toTree: (
  selections: (
    | Selection<import('../..').DataTrait>
    | Selection<import('../..').DataTrait>[]
  )[]
) => SelectionTree<any>
