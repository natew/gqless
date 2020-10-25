const lazyGetters = (obj, onEvaluated) => {
  for (const key in obj) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key)
    if (!descriptor) continue
    const prevGet = descriptor.get

    if (!prevGet) {
      onEvaluated === null || onEvaluated === void 0
        ? void 0
        : onEvaluated(key, obj[key])
      continue
    }

    if (!descriptor.configurable) continue
    Object.defineProperty(obj, key, {
      ...descriptor,

      get() {
        const value = prevGet()
        Object.defineProperty(obj, key, {
          configurable: true,
          writable: false,
          enumerable: true,
          value,
        })
        onEvaluated === null || onEvaluated === void 0
          ? void 0
          : onEvaluated(key, value)
        return value
      },
    })
  }

  return obj
}

const createEvent = () => {
  return new Event()
}
class Event {
  constructor() {
    this.listeners = new Set()

    this.emit = (...args) => {
      for (const emit of Array.from(this.listeners)) {
        emit(...args)
      }
    }
  }

  listen(callback) {
    this.listeners.add(callback)
    return () => this.off(callback)
  }

  filter(filter) {
    const filteredEvent = createEvent()
    this.listen((...args) => {
      const shouldEmit = filter(...args)
      if (!shouldEmit) return
      return filteredEvent.emit(...args)
    })
    return filteredEvent
  }

  then(callback) {
    const listener = (...args) => {
      this.off(listener)
      return callback(...args)
    }

    return this.listen(listener)
  }

  off(callback) {
    this.listeners.delete(callback)
  }
}

const isProduction = process.env.NODE_ENV === 'production'
const prefix = `[gqless] `
function invariant(condition, message) {
  if (condition) return

  if (isProduction) {
    throw new Error(
      prefix +
        'invariant exception occured! view full message in development mode'
    )
  } else {
    throw new Error(prefix + message)
  }
}

const createDependency = () => ({
  weak: new WeakMap(),
  strong: new Map(),
})

const dependencyType = data =>
  data && data instanceof Object ? 'weak' : 'strong'
/**
 * Memory-leak free memoization
 */

function createMemo() {
  const cache = new Map()

  const memoKey = (key = 'default') => {
    if (!cache.has(key)) cache.set(key, createDependency())
    const keyDependency = cache.get(key)

    function memo(getOrDependencies, dependencies = []) {
      const get =
        typeof getOrDependencies === 'function' ? getOrDependencies : undefined
      if (!get) dependencies = getOrDependencies
      let dependency = keyDependency
      let index = 0
      const changedDependency = dependencies.find((data, i) => {
        index = i
        const type = dependencyType(data)
        if (!dependency[type].has(data)) return true
        dependency = dependency[type].get(data)
        return false
      })
      if (!changedDependency && 'value' in dependency) return dependency.value
      if (!get) return

      for (let i = index; i < dependencies.length; i++) {
        const data = dependencies[i]
        const newDependency = createDependency()
        dependency[dependencyType(data)].set(data, newDependency)
        dependency = newDependency
      }

      const value = get()
      dependency.value = value
      return value
    }

    return memo
  }

  return new Proxy(memoKey(), {
    get(_, prop) {
      return memoKey(prop)
    },
  })
}

const isProduction$1 = process.env.NODE_ENV === 'production'
const prefix$1 = `[gqless] `
function warning(condition, message) {
  if (condition) return
  if (isProduction$1) return
  const text = prefix$1 + message

  if (typeof console !== 'undefined') {
    console.warn(text)
  } // Throwing an error and catching it immediately
  // to improve debugging
  // A consumer can use 'pause on caught exceptions'
  // https://github.com/facebook/react/issues/4216

  try {
    throw Error(text)
  } catch (x) {}
}

const computed = (target, propertyKey, descriptor) => {
  const getValue = descriptor.get

  descriptor.get = function() {
    const value =
      getValue === null || getValue === void 0 ? void 0 : getValue.call(this)
    Object.defineProperty(this, propertyKey, {
      enumerable: true,
      value,
    })
    return value
  }
}

export {
  Event,
  computed,
  createEvent,
  createMemo,
  invariant,
  lazyGetters,
  warning,
}
//# sourceMappingURL=utils.esm.js.map
