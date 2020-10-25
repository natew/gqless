import { FieldSelection } from '../Selection'
import { Accessor } from './Accessor'
import { DataContext } from '../Node'
export declare class FieldAccessor<
  TFieldSelection extends FieldSelection<any> = FieldSelection<any>,
  TChildren extends Accessor = Accessor
> extends Accessor<TFieldSelection, TChildren> {
  parent: Accessor
  protected _resolved: boolean
  constructor(parent: Accessor, fieldSelection: TFieldSelection)
  protected initializeExtensions(): void
  getData(ctx?: DataContext): any
  toString(): string
}
