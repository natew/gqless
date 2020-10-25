import { Query, Accessor, Fragment, ObjectNode, Scheduler } from 'gqless'
import { StackContext } from '../Query'
export declare type VariantFragments = Map<Accessor, Set<Fragment>>
export declare type ComponentFragment = WeakMap<ObjectNode, Fragment>
export interface ComponentContext {
  query: Query
  stack: StackContext
  accessors: Set<Accessor>
  schedulers: Set<Scheduler>
  variantFragments: VariantFragments
  lastStateIndex: number
  state: any[]
}
/**
 * Returns the current context, for a component
 * wrapped in `graphql()`
 */
export declare const useComponentContext: {
  (): ComponentContext
  value: ComponentContext | undefined
}
