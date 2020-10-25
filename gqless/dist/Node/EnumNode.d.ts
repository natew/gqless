import { DataTrait, DataContext } from './traits'
export declare type IEnumNodeOptions = {
  name?: string
}
export declare class EnumNode implements DataTrait {
  name?: string
  constructor({ name }?: IEnumNodeOptions)
  toString(): string
  getData(ctx: DataContext<EnumNode>): any
}
