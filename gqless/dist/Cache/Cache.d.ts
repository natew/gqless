import { Accessor } from '../Accessor'
import { Value } from './Value'
import { deepReference } from './utils'
import { ObjectNode, DataTrait } from '../Node'
import { NodeEntry } from './NodeEntry'
import { Disposable } from '../utils'
export declare class Cache extends Disposable {
  references: ReturnType<typeof deepReference>
  entries: Map<DataTrait, NodeEntry>
  onRootValueChange: import('@gqless/utils').Event<(...args: any[]) => any>
  constructor(node: ObjectNode)
  private _rootValue
  get rootValue(): Value
  set rootValue(value: Value)
  merge(accessor: Accessor, data: any): void
  toJSON(
    deep?: boolean
  ): {
    data: any
    types: any
  }
  dispose(): void
}
