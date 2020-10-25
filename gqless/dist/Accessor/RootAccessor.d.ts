import { Cache, Value } from '../Cache'
import { ObjectNode, DataContext } from '../Node'
import { Scheduler } from '../Scheduler'
import { Selection } from '../Selection'
import { Accessor } from './Accessor'
export declare class RootAccessor<
  TSelection extends Selection<ObjectNode> = Selection<ObjectNode>,
  TChildren extends Accessor = Accessor
> extends Accessor<TSelection, TChildren> {
  scheduler: Scheduler
  cache: Cache
  constructor(selection: TSelection, scheduler: Scheduler, cache?: Cache)
  getData(ctx?: DataContext): any
  updateValue(value: Value): void
  toString(): string
}
