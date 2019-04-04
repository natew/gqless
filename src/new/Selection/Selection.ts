import { Node, NodeDataType } from '../Node'
import { computed } from '../../utils'
import { SelectionField } from './SelectionField'
import { SelectionIndex } from './SelectionIndex'
import { SelectionRoot } from './SelectionRoot'

export type USelection =
  | SelectionRoot<any>
  | SelectionField<any, any>
  | SelectionIndex<any>

interface CircularSelection extends Selection<any, CircularSelection> {}

export abstract class Selection<
  TNode extends Node<any>,
  S extends CircularSelection = CircularSelection
> {
  protected disposers: Function[] = []
  public selections: S[] = []

  private _value: NodeDataType<TNode>
  private valueListeners: (() => void)[] = []
  private hasComputedValue = false

  constructor(public parent: Selection<any>, public node: TNode) {
    if (parent) {
      parent.selections.push(this)
      this.disposers.push(() => {
        const idx = parent.selections.indexOf(this)

        if (idx > -1) {
          parent.selections.splice(idx, 1)
        }
      })
    }
  }

  public getSelection<SelectionType extends S>(
    compare: (selection: SelectionType) => boolean,
    create?: () => SelectionType
  ): SelectionType {
    const selection = (this.selections as SelectionType[]).find(compare)
    if (selection) return selection

    return create ? create() : null
  }

  @computed()
  public get path(): Selection<any, any>[] {
    const basePath = this.parent ? this.parent.path : []
    const path = [...basePath, this]

    path.toString = () => path.map(selection => selection.toString()).join('.')

    return path
  }

  public get value() {
    if (!this.hasComputedValue) this.computeValue()

    return this._value
  }

  public set value(value: NodeDataType<TNode>) {
    const prevValue = this._value
    this._value = value

    if (prevValue !== value) {
      this.valueListeners.forEach(cb => cb())
    }
  }

  protected computeValue() {
    this.hasComputedValue = true
  }

  /**
   * Conditonally computes the value, only if it's been computed before
   */
  public recomputeValue() {
    if (!this.hasComputedValue) return
    this.computeValue()
  }

  public onValueChange(callback: () => void) {
    this.valueListeners.push(callback)

    return () => {
      const idx = this.valueListeners.indexOf(callback)

      if (idx > -1) {
        this.valueListeners.splice(idx, 1)
      }
    }
  }

  public then(resolve: (value: NodeDataType<TNode>) => void) {
    const attemptResolve = () => {
      if (this.value !== undefined) {
        dispose()
        resolve(this.value)
      }
    }
    const dispose = this.onValueChange(attemptResolve)
    attemptResolve()
    return this
  }

  public destroy() {
    this.selections.forEach(s => s.destroy())
    this.disposers.forEach(dispose => dispose())
  }
}
