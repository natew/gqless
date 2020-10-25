import { Fragment } from '../Selection'
import { Accessor } from './Accessor'
import { DataContext } from '../Node'
export declare class FragmentAccessor<
  TFragment extends Fragment = Fragment,
  TChildren extends Accessor = Accessor
> extends Accessor<TFragment, TChildren> {
  parent: Accessor
  protected _resolved: boolean
  constructor(parent: Accessor, fragment: TFragment)
  /**
   * Makes the parent temporarily return
   * this accessor's data
   */
  startResolving(): () => void
  protected initializeExtensions(): void
  getData(ctx?: DataContext): any
  toString(): string
}
