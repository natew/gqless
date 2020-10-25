export declare const createEvent: <TCallback extends (
  ...args: any[]
) => any>() => Event<(...args: any[]) => any>
export declare class Event<TCallback extends (...args: any[]) => any> {
  listeners: Set<TCallback>
  listen(callback: TCallback): () => void
  filter(
    filter: (...parameters: Parameters<TCallback>) => boolean
  ): Event<(...args: any[]) => any>
  then(callback: TCallback): () => void
  off(callback: TCallback): void
  emit: (...args: Parameters<TCallback>) => void
}
