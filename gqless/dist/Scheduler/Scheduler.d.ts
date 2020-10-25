import { Plugins } from '../Plugin'
import { Disposable } from '../utils'
import { Commit } from './Commit'
import { Query } from './Query'
import { Accessor } from '../Accessor'
export declare type AccessorFetcher = (
  accessors: Accessor[],
  queryName?: string
) => any
export declare class Scheduler extends Disposable {
  private fetchAccessors
  plugins: Plugins
  interval: number
  private timer
  stack: Query[]
  commit: Commit
  constructor(
    fetchAccessors: AccessorFetcher,
    plugins?: Plugins,
    interval?: number
  )
  pushStack(...queries: Query[]): void
  popStack(...queries: Query[]): void
  private startTimer
  private clearTimer
}
