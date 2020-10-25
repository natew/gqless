import { DataTrait } from '../Node'
export declare type UValueData =
  | string
  | number
  | boolean
  | {
      [key: string]: Value
    }
  | Value[]
  | null
export declare class Value<TNode extends DataTrait = DataTrait> {
  node: TNode
  id: number
  private _data
  references: Map<Value<DataTrait>, Set<string | number>>
  constructor(node: TNode, data?: UValueData)
  onSet: import('@gqless/utils').Event<(...args: any[]) => any>
  onChange: import('@gqless/utils').Event<(...args: any[]) => any>
  onReference: import('@gqless/utils').Event<(...args: any[]) => any>
  onUnreference: import('@gqless/utils').Event<(...args: any[]) => any>
  get data(): UValueData
  set data(data: UValueData)
  get(key: string | number): Value | undefined
  set(key: string | number, value: Value): void
  toJSON(deep?: boolean): any
}
