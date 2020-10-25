import { Cache, Value } from '../Cache'
import {
  ObjectNode,
  DataTrait,
  ComputedExtension,
  StaticExtension,
  DataContext,
} from '../Node'
import { Scheduler } from '../Scheduler'
import { Selection, Fragment } from '../Selection'
import { Disposable } from '../utils'
import { FragmentAccessor } from '.'
export declare enum NetworkStatus {
  idle = 0,
  loading = 1,
  updating = 2,
}
export declare const ACCESSOR: unique symbol
export declare abstract class Accessor<
  TSelection extends Selection = Selection,
  TChildren extends Accessor<Selection, any> = Accessor<Selection, any>
> extends Disposable {
  readonly parent: Accessor | undefined
  readonly selection: TSelection
  readonly node: DataTrait
  extensions: (StaticExtension | ComputedExtension)[]
  children: TChildren[]
  scheduler: Scheduler
  cache: Cache
  fragmentToResolve?: FragmentAccessor
  protected _data: any
  protected _status: NetworkStatus
  protected _value: Value | undefined
  protected _resolved: boolean
  onValueChange: import('@gqless/utils').Event<(...args: any[]) => any>
  onDataChange: import('@gqless/utils').Event<(...args: any[]) => any>
  onResolvedChange: import('@gqless/utils').Event<(...args: any[]) => any>
  onStatusChange: import('@gqless/utils').Event<(...args: any[]) => any>
  onInitializeExtensions: import('@gqless/utils').Event<(...args: any[]) => any>
  constructor(
    parent: Accessor | undefined,
    selection: TSelection,
    node?: DataTrait
  )
  get resolved(): boolean
  set resolved(resolved: boolean)
  get data(): any
  set data(data: any)
  set status(status: NetworkStatus)
  get status(): NetworkStatus
  set value(value: Value | undefined)
  get value(): Value | undefined
  protected initializeExtensions(): void
  protected loadExtensions(): void
  updateValue(value: Value): void
  getData(ctx?: DataContext): any
  setData(data: any): void
  get<TChild extends TChildren | FragmentAccessor>(
    find:
      | ((child: TChildren | FragmentAccessor) => boolean)
      | Selection
      | string
      | number
  ): TChild | undefined
  getDefaultFragment(node: ObjectNode): Fragment<ObjectNode>
  get selectionPath(): Selection[]
  get path(): Accessor[]
  dispose(): void
}
