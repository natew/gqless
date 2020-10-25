import { Plugins } from '../Plugin'
import { Accessor } from '../Accessor'
import { Disposable } from '../utils'
import { Query } from './Query'
export declare class Commit extends Disposable {
  private plugins
  private stack
  private fetchAccessors
  onActive: import('@gqless/utils').Event<(...args: any[]) => any>
  onIdle: import('@gqless/utils').Event<(...args: any[]) => any>
  onFetched: import('@gqless/utils').Event<(...args: any[]) => any>
  accessors: Map<
    Accessor<
      import('..').Selection<import('..').DataTrait>,
      Accessor<import('..').Selection<import('..').DataTrait>, any>
    >,
    Query[]
  >
  constructor(
    plugins: Plugins,
    stack: Query[],
    fetchAccessors: (accessors: Accessor<any>[], queryName?: string) => any
  )
  stageUntilValue(accessor: Accessor): (() => void) | undefined
  stage(accessor: Accessor, ...queries: Query[]): () => void
  unstage(accessor: Accessor): void
  fetch(): Promise<void>
}
