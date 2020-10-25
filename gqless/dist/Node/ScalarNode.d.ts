import {
  NodeExtension,
  StaticExtension,
  ComputableExtension,
} from './Extension'
import { Matchable } from './abstract/Matchable'
import { Value } from '../Cache'
import { DataTrait, DataContext } from './traits'
export declare type IScalarNodeOptions = {
  name?: string
  extension?: NodeExtension
}
export declare class ScalarNode extends Matchable implements DataTrait {
  extension?: StaticExtension | ComputableExtension
  name?: string
  constructor({ name, extension }?: IScalarNodeOptions)
  match(value: Value, data: any): Value<DataTrait> | null | undefined
  toString(): string
  getData(ctx: DataContext): any
}
