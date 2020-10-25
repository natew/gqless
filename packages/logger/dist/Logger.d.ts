import './loadFormatters'
import { Client, QueryResponse, Plugin } from 'gqless'
export declare class Logger implements Plugin {
  protected client: Client
  private verbose
  constructor(client: Client, verbose?: boolean)
  onCommit: (data: {
    accessors: import('gqless').Accessor<
      import('gqless').Selection<import('gqless').DataTrait>,
      import('gqless').Accessor<
        import('gqless').Selection<import('gqless').DataTrait>,
        any
      >
    >[]
    stacks: import('gqless').Query[][]
    stackQueries: import('gqless').Query[]
    queries: Map<
      import('gqless').Query | undefined,
      import('gqless').Accessor<
        import('gqless').Selection<import('gqless').DataTrait>,
        import('gqless').Accessor<
          import('gqless').Selection<import('gqless').DataTrait>,
          any
        >
      >[]
    >
  }) => void
  onFetch: (
    accessors: import('gqless').Accessor<
      import('gqless').Selection<import('gqless').DataTrait>,
      import('gqless').Accessor<
        import('gqless').Selection<import('gqless').DataTrait>,
        any
      >
    >[],
    response: Promise<QueryResponse<any>>,
    variables: Record<string, any> | undefined,
    query: string,
    queryName: string | undefined
  ) => void
}
