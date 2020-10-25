import { DataTrait } from '../Node'
export declare class Selection<TNode extends DataTrait = DataTrait> {
  node: TNode
  keySelections: Set<Selection<DataTrait>>
  selections: Set<Selection<DataTrait>>
  /**
   * Emitted when a child selection is created
   */
  onSelect: import('@gqless/utils').Event<(...args: any[]) => any>
  /**
   * Emitted when a child selection is unselected
   */
  onUnselect: import('@gqless/utils').Event<(...args: any[]) => any>
  constructor(node: TNode)
  add(selection: Selection, isKeySelection?: boolean): void
  get<TSelection extends Selection>(
    find: ((selection: Selection) => boolean) | string | number
  ): TSelection | undefined
  delete(selection: Selection): void
  toString(): string
}
