import {
  Variable,
  getAccessor,
  Poller,
  FragmentAccessor,
  getAbstractImplementation,
  Fragment,
  fragmentOn,
  NodeContainer,
  Query as Query$1,
  afterTransaction,
  Interceptor,
  NetworkStatus,
} from 'gqless'
import {
  useEffect,
  useState,
  useMemo,
  createContext,
  useContext,
  createElement,
  useRef,
  Fragment as Fragment$1,
} from 'react'
import { invariant, createMemo } from '@gqless/utils'

/**
 * Returns the current context, for a component
 * wrapped in `graphql()`
 */

const useComponentContext = () => {
  !useComponentContext.value
    ? process.env.NODE_ENV !== 'production'
      ? invariant(
          false,
          `not called within a wrapped graphql() component's render phase`
        )
      : invariant(false)
    : void 0
  return useComponentContext.value
}
useComponentContext.value = undefined

/**
 * createMemo, persisted across all instances of Component
 */

const useComponentMemo = (getValue, dependencies) => {
  const context = useComponentContext()
  const stateIndex = ++context.lastStateIndex
  const memo =
    context.state[stateIndex] || (context.state[stateIndex] = createMemo())
  return memo(getValue, dependencies)
}

function useVariable(value, _1, _2) {
  const nullable = typeof _1 === 'boolean' ? _1 : undefined
  const name = _2 !== undefined ? _2 : typeof _1 === 'string' ? _1 : undefined // TODO: useMemo

  const variable = useComponentMemo(
    () =>
      new Variable(value, {
        name,
        nullable,
      }),
    []
  )
  useEffect(() => {
    if (nullable === undefined) return
    variable.updateNullable(nullable)
  }, [variable, nullable])
  useEffect(() => {
    variable.updateValue(value)
  }, [variable, value])
  return variable
}

const usePoll = (data, interval, initiallyPolling = true) => {
  const accessor = getAccessor(data)
  const { stack } = useComponentContext()
  const [isPolling, setIsPolling] = useState(initiallyPolling)
  const poller = useMemo(() => new Poller(accessor, interval, stack.frames), [
    accessor,
  ])
  useEffect(() => () => poller.toggle(false), [accessor])
  useEffect(() => {
    poller.updateInterval(interval)
  }, [interval])
  useEffect(() => {
    poller.toggle(isPolling)
  }, [poller, isPolling])
  return [
    isPolling,
    (poll = !isPolling) => {
      setIsPolling(poll)
    },
  ]
}

/**
 * Creates a new fragment (same across all instances of component)
 */

function useFragment(data, onType, fragmentName) {
  let accessor = getAccessor(data)

  if (accessor instanceof FragmentAccessor) {
    accessor = accessor.parent
  }

  const node = useMemo(() => {
    const node =
      accessor.node instanceof NodeContainer
        ? accessor.node.innerNode
        : accessor.node

    if (onType) {
      const nodeImplementation = getAbstractImplementation(node, onType)
      if (nodeImplementation) return nodeImplementation
    }

    return node
  }, [accessor.node, onType])
  const fragment = useComponentMemo(() => new Fragment(node, fragmentName), [
    node,
  ])
  useMemo(() => {
    if (!fragmentName) return
    fragment.name = fragmentName
  }, [fragment, fragmentName])
  const fragmentData = useMemo(() => fragmentOn(accessor, fragment), [
    accessor,
    fragment,
  ])
  return fragmentData
}

const useTracked = () => {
  const { stack, schedulers } = useComponentContext()
  return callback => {
    try {
      schedulers.forEach(s => s.pushStack(...stack.frames))
      return callback()
    } finally {
      schedulers.forEach(s => s.popStack(...stack.frames))
    }
  }
}

const StackContext =
  /*#__PURE__*/
  createContext({
    frames: [],
    inheritance: true,
  })
const Query = ({ value = null, allowInheritance = false, children }) => {
  const parentStack = useContext(StackContext)
  const stack = useMemo(() => {
    const frames =
      value === null
        ? parentStack.frames
        : value instanceof Query$1
        ? [value]
        : (Array.isArray(value) ? value : [value]).map(
            value => new Query$1(typeof value === 'string' ? value : undefined)
          )
    return {
      frames,
      inheritance:
        allowInheritance === null ? parentStack.inheritance : allowInheritance,
    }
  }, [value, allowInheritance])
  return createElement(
    StackContext.Provider,
    {
      value: stack,
    },
    children
  )
}

const useForceUpdate = () => {
  const [_, setRerenders] = useState(0)
  const timerRef = useRef()
  const mountedRef = useRef(true)
  useEffect(() => {
    return () => {
      var _timerRef$current

      clearTimeout(
        (_timerRef$current = timerRef.current) === null ||
          _timerRef$current === void 0
          ? void 0
          : _timerRef$current.timer
      )
      mountedRef.current = false
    }
  }, [])
  return callback =>
    afterTransaction(() => {
      if (!mountedRef.current) return

      const setRef = () => {
        timerRef.current = {
          rendered: false,
          timer: setTimeout(() => {
            timerRef.current = undefined
          }),
        }
      }

      if (!timerRef.current) setRef()
      if (timerRef.current.rendered) return
      timerRef.current.rendered = true
      setRerenders(r => r + 1)
      callback === null || callback === void 0 ? void 0 : callback()
    })
}

const useInterceptor = stack => {
  // Create a new Interceptor, which tracks the usage
  // of accessors
  const interceptor = new Interceptor() // When a new accessor is found, retrieve the
  // scheduler associated with it
  //
  // Then call Scheduler#pushStack, with the
  // component's stack

  const schedulers = new Set()
  const interceptedAccessors = new Set() // @ts-ignore

  interceptor.onAccessor.listen(accessor => {
    interceptedAccessors.add(accessor)
    if (schedulers.has(accessor.scheduler)) return
    schedulers.add(accessor.scheduler)
    accessor.scheduler.pushStack(...stack.frames)
  })
  return {
    interceptor,
    schedulers,
    interceptedAccessors,

    startIntercepting() {
      interceptor.start()
    },

    stopIntercepting() {
      interceptor.stop() // Cleanup the previous Scheduler#pushStack
      // calls made earlier

      schedulers.forEach(scheduler => {
        scheduler.popStack(...stack.frames)
      })
    },
  }
}

const useAccessors = stack => {
  const accessors = useMemo(() => new Set(), [])
  const accessorDisposers = useMemo(() => new Map(), [])
  const forceUpdate = useForceUpdate()
  useEffect(() => {
    return () => {
      accessorDisposers.forEach(disposers => {
        disposers.forEach(dispose => dispose())
      })
    }
  }, [])
  const interceptor = useInterceptor(stack)
  return {
    ...interceptor,
    accessors,

    updateAccessors() {
      // Find all the new accessors and add to Set
      interceptor.interceptedAccessors.forEach(accessor => {
        if (accessors.has(accessor)) return
        accessors.add(accessor)
        accessorDisposers.set(
          accessor, // Make component update when data changes
          [
            accessor.onDataChange.listen(() => {
              forceUpdate()
            }),
            accessor.onStatusChange.listen((newValue, prevValue) => {
              const prevIdle = prevValue === NetworkStatus.idle
              const active = newValue !== NetworkStatus.idle

              if (prevIdle && active) {
                forceUpdate()
              }
            }),
          ]
        )
      })
      const nonIdleAccessors = new Set()
      accessors.forEach(accessor => {
        // Locate accessors currently being fetched,
        // and add to Set
        if (interceptor.interceptedAccessors.has(accessor)) {
          if (accessor.status === NetworkStatus.loading) {
            nonIdleAccessors.add(accessor)
          }

          return
        } // Remove previously used accessors, that
        // aren't required anymore

        const disposers = accessorDisposers.get(accessor)

        if (disposers) {
          accessorDisposers.delete(accessor)
          disposers.forEach(dispose => dispose())
        }

        accessors.delete(accessor)
      })

      if (nonIdleAccessors.size) {
        return new Promise(resolve => {
          nonIdleAccessors.forEach(accessor => {
            accessor.onStatusChange.then(() => {
              nonIdleAccessors.delete(accessor)
              if (!nonIdleAccessors.size) resolve()
            })
          })
        })
      }
    },
  }
}

const VariantContext =
  /*#__PURE__*/
  createContext([])
const useFragments = () => {
  const variant = useContext(VariantContext)
  const variantFragments = new Map()
  const stopResolving = []
  return {
    variantFragments,

    startResolving() {
      variant.forEach(([accessor, fragment]) => {
        const fragmentAccessor =
          accessor.get(a => a.selection === fragment) ||
          new FragmentAccessor(accessor, fragment)
        stopResolving.push(fragmentAccessor.startResolving())
      })
    },

    stopResolving() {
      stopResolving.forEach(stop => stop())
    },

    getRenderVariants() {
      let variants = []
      variantFragments.forEach((fragments, accessor) => {
        // Only render variations for accessors
        // without a value and non-idle
        if (accessor.value || accessor.status === NetworkStatus.idle) return

        if (!variants.length) {
          fragments.forEach(fragment => variants.push([[accessor, fragment]]))
          return
        }

        const newVariants = []
        fragments.forEach(fragment => {
          for (let i = 0; i < variants.length; i++) {
            const variant = variants[i]
            newVariants.push([...variant, [accessor, fragment]])
          }
        })
        variants = newVariants
      })
      return variants
    },
  }
}

const graphql = (
  component,
  {
    name = (component === null || component === void 0
      ? void 0
      : component.displayName) ||
      (component === null || component === void 0 ? void 0 : component.name),
    allowInheritance = null,
    seperateRequest = false,
  } = {}
) => {
  const query = new Query$1(name, false)
  const state = []

  const WithGraphQL = props => {
    let returnValue
    const parentVariant = useContext(VariantContext)
    const parentStack = useContext(StackContext)
    const stack = useMemo(() => {
      if (!parentStack.inheritance) return parentStack
      return {
        ...parentStack,
        inheritance:
          allowInheritance === null
            ? parentStack.inheritance
            : allowInheritance,
        frames: seperateRequest ? [query] : [...parentStack.frames, query],
      }
    }, [seperateRequest || parentStack])
    useComponentContext.value = {
      variantFragments: undefined,
      lastStateIndex: -1,
      state,
      stack,
      accessors: undefined,
      query,
      schedulers: undefined,
    }
    const {
      accessors,
      schedulers,
      startIntercepting,
      stopIntercepting,
      updateAccessors,
    } = useAccessors(stack)
    Object.assign(useComponentContext.value, {
      accessors,
      schedulers,
    })
    const {
      variantFragments,
      startResolving,
      stopResolving,
      getRenderVariants,
    } = useFragments()
    Object.assign(useComponentContext.value, {
      variantFragments,
    })

    try {
      startResolving()
      startIntercepting()
      returnValue = component(props)
    } catch (e) {
      throw e
    } finally {
      useComponentContext.value = undefined
      stopIntercepting()
      stopResolving()
    } // If we've recorded Abstract accessors in the
    // variantFragments, then create an array
    // containing all variants of the resolved types
    //
    // then return a new component for each variant,
    // which will convert accessors into fragmentaccessors
    // at render.

    if (variantFragments.size) {
      const renderVariants = getRenderVariants()
      if (renderVariants.length)
        return renderVariants.map((variant, i) =>
          createElement(
            VariantContext.Provider,
            {
              key: i,
              value: [...parentVariant, ...variant],
            },
            createElement(WithGraphQL, Object.assign({}, props))
          )
        )
    }

    returnValue = createElement(
      StackContext.Provider,
      {
        value: stack,
      },
      returnValue
    )
    const promise = updateAccessors() // React suspense support

    if (promise) {
      let resolved = false
      promise.then(() => (resolved = true)) // We can't directly throw the promise, otherwise
      // child components (with data requirements) won't
      // render - meaning multiple requests
      //
      // To prevent this we instead return a Fragment,
      // which contains a component that throws the Promise.

      const Suspend = () => {
        // This is necessary to prevent an infinite loop
        if (resolved) return null
        throw promise
      }

      return createElement(
        Fragment$1,
        null,
        returnValue,
        createElement(Suspend, null)
      )
    }

    return returnValue
  }

  WithGraphQL.displayName = `GraphQLComponent(${name || 'Component'})`
  WithGraphQL.query = query
  return WithGraphQL
}

function ofType(data, typename) {
  try {
    const { variantFragments } = useComponentContext()
    const accessor = getAccessor(data)
    const node = getAbstractImplementation(accessor.node, typename)

    if (node) {
      const fragment = accessor.getDefaultFragment(node)
      if (!variantFragments.has(accessor))
        variantFragments.set(accessor, new Set())
      variantFragments.get(accessor).add(fragment)
    }
  } catch {
    // useComponentContext / getAccessor could fail
  }

  return data.__typename === typename
}

export {
  Query,
  StackContext,
  graphql,
  ofType,
  useFragment,
  usePoll,
  useTracked,
  useVariable,
}
//# sourceMappingURL=react.esm.js.map
