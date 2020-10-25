import { StaticExtension, ComputableExtension, Extension } from '../Extension'
import { Accessor } from '../../Accessor'
import { Selection } from '../../Selection'
import { Value } from '../../Cache'
export declare type DataContext<TNode extends DataTrait = DataTrait> = {
  accessor?: Accessor<Selection<TNode>>
  selection?: Selection<TNode>
  extensions?: Extension[]
  value?: Value
}
export declare const interceptAccessor: (ctx: DataContext<DataTrait>) => void
export declare const getExtensions: (ctx: DataContext<DataTrait>) => Extension[]
export declare const getSelection: (
  ctx: DataContext<DataTrait>
) => Selection<DataTrait> | undefined
export declare const getValue: (
  ctx: DataContext<DataTrait>
) => Value<DataTrait> | undefined
export interface DataTrait {
  extension?: StaticExtension | ComputableExtension
  getData(ctx: DataContext): any
}
