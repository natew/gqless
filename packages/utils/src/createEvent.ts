type ITCallback = (...args: any[]) => any

type Event = {
  (callback: ITCallback): () => void
  listeners: Set<ITCallback>
  emit: (...args: any[]) => any
  off: (callback: ITCallback) => void
  then: (callback: ITCallback) => () => void
  filter: (filter: (...parameters: Parameters<any>) => boolean) => Event
}

export const createEvent = <A extends any>() => {
  const listeners = new Set<ITCallback>()

  const event = function event(callback: ITCallback) {
    listeners.add(callback)
    return () => {
      // @ts-ignore
      event.off(callback)
    }
  }
  event.listeners = listeners
  event.emit = eventEmit.bind(event as any)
  event.off = eventOff.bind(event as any)
  event.filter = eventFilter.bind(event as any)
  event.then = eventThen.bind(event as any)
  return event
}

export function eventEmit(this: Event, ...args: Parameters<ITCallback>) {
  for (const emit of Array.from(this.listeners)) {
    emit(...args)
  }
}

export function eventOff(this: Event, callback: ITCallback) {
  this.listeners.delete(callback)
}

export function eventThen(this: Event, callback: ITCallback) {
  const listener = ((...args: any[]) => {
    this.off(listener)
    return callback(...args)
  }) as ITCallback
  return this(listener)
}

export function eventFilter(
  this: Event,
  filter: (...parameters: Parameters<any>) => boolean
) {
  const filteredEvent = createEvent()

  this(((...args: Parameters<ITCallback>) => {
    const shouldEmit = filter(...args)
    if (!shouldEmit) return
    return filteredEvent.emit(...args)
  }) as ITCallback)

  return filteredEvent
}
