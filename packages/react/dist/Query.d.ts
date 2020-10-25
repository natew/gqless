import * as React from 'react'
import { Query as QueryCl } from 'gqless'
export interface StackContext {
  frames: QueryCl[]
  inheritance: boolean
}
export declare const StackContext: React.Context<StackContext>
declare type QueryFrame = QueryCl | string | undefined
export declare const Query: React.SFC<{
  value?: QueryFrame[] | QueryFrame | null
  /**
   * Whether or not child components can use their own queries.
   *
   * true  | child components can use their own queries
   * false | (default) all queries will be merged into this components query
   * null  | inherited with React context
   */
  allowInheritance?: boolean | null
  children: any
}>
export {}
