import { createMemo } from '@gqless/utils'

import { FieldSelection } from '../../Selection'
import { SelectionTree } from './SelectionTree'

let id = 0

export const getAlias = (tree: SelectionTree<FieldSelection>) => {
  if (!tree.parent) return
  for (const siblingTree of tree.parent.children) {
    if (siblingTree.selection instanceof FieldSelection) {
      if (
        tree.selection !== siblingTree.selection ||
        tree.selection.field === siblingTree.selection.field
      ) {
        id = (id + 1) % Number.MAX_VALUE
        return `${tree.selection.field.name}__${id}`
      }
    }
  }
  return tree.selection.field.name
}
