import { Value } from './Value'
import { DataTrait } from '../Node'
export declare class NodeEntry {
  node: DataTrait
  instances: Set<Value<DataTrait>>
  keys: Map<any, Value<DataTrait>>
  constructor(node: DataTrait)
  match(
    data: any
  ):
    | {
        value: Value<DataTrait>
        exactValue: Value<DataTrait>
      }
    | undefined
  getByKey(key: any): Value<DataTrait> | undefined
  toJSON(
    deep?: boolean
  ): {
    keys: Record<string, any>
    instances: any[]
  }
}
