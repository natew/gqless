import { Query } from '../Scheduler'
export declare class Poller {
  interval: number
  stack?: Query[] | undefined
  private accessor
  private timer?
  private unstage?
  polling: boolean
  constructor(data: any, interval: number, stack?: Query[] | undefined)
  updateInterval(interval: number): void
  /**
   * Polls the selection, scheduling a new poll
   * only after it's been fetched
   */
  private poll
  private pollAfterInterval
  resetTimer(): void
  toggle(poll?: boolean): void
}
