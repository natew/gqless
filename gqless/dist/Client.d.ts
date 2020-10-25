import { RootAccessor, Accessor } from './Accessor'
import { Cache } from './Cache'
import { ObjectNode } from './Node'
import { Plugins } from './Plugin'
import { Scheduler } from './Scheduler'
import { Selection } from './Selection'
import { Disposable } from './utils'
import { Formatter } from './QueryBuilder'
export declare type QueryResponse<Data = any> = {
  data: Data
  errors: any
}
export declare type QueryFetcher = (
  query: string,
  variables?: Record<string, any>
) => Promise<QueryResponse> | QueryResponse
export declare type ClientOptions = {
  prettifyQueries?: boolean
}
export declare class Client<TData = any> extends Disposable {
  protected node: ObjectNode
  protected fetchQuery: QueryFetcher
  plugins: Plugins
  formatter: Formatter
  scheduler: Scheduler
  cache: Cache
  selection: Selection<ObjectNode>
  accessor: RootAccessor<
    Selection<ObjectNode>,
    Accessor<
      Selection<import('./Node').DataTrait>,
      Accessor<Selection<import('./Node').DataTrait>, any>
    >
  >
  query: TData
  constructor(
    node: ObjectNode,
    fetchQuery: QueryFetcher,
    { prettifyQueries }?: ClientOptions
  )
  protected fetchAccessors(
    accessors: Accessor[],
    queryName?: string
  ): Promise<QueryResponse<any>> | undefined
  dispose(): void
}
