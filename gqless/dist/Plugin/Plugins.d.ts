import { Plugin } from './Plugin'
declare type ComposablePlugin = (plugin: Plugin[]) => Plugin[]
export declare class Plugins {
  private plugins
  add(...plugins: Plugin[]): void
  add(plugin: ComposablePlugin): void
  remove(...plugins: Plugin[]): void
  all: {
    onSelect: (selection: import('..').Selection<any>) => void[]
    onUnselect: (selection: import('..').Selection<any>) => void[]
    onCommit: (data: {
      accessors: import('..').Accessor<
        import('..').Selection<import('..').DataTrait>,
        import('..').Accessor<
          import('..').Selection<import('..').DataTrait>,
          any
        >
      >[]
      stacks: import('..').Query[][]
      stackQueries: import('..').Query[]
      queries: Map<
        import('..').Query | undefined,
        import('..').Accessor<
          import('..').Selection<import('..').DataTrait>,
          import('..').Accessor<
            import('..').Selection<import('..').DataTrait>,
            any
          >
        >[]
      >
    }) => void[]
    onFetch: (
      accessors: import('..').Accessor<
        import('..').Selection<import('..').DataTrait>,
        import('..').Accessor<
          import('..').Selection<import('..').DataTrait>,
          any
        >
      >[],
      response: Promise<import('..').QueryResponse<any>>,
      variables: Record<string, any> | undefined,
      query: string,
      queryName: string | undefined
    ) => void[]
    dispose: () => void[]
  }
  first: {
    onSelect: (
      selection: import('..').Selection<any>
    ) => (isCorrectValue: (value: void) => boolean) => void
    onUnselect: (
      selection: import('..').Selection<any>
    ) => (isCorrectValue: (value: void) => boolean) => void
    onCommit: (data: {
      accessors: import('..').Accessor<
        import('..').Selection<import('..').DataTrait>,
        import('..').Accessor<
          import('..').Selection<import('..').DataTrait>,
          any
        >
      >[]
      stacks: import('..').Query[][]
      stackQueries: import('..').Query[]
      queries: Map<
        import('..').Query | undefined,
        import('..').Accessor<
          import('..').Selection<import('..').DataTrait>,
          import('..').Accessor<
            import('..').Selection<import('..').DataTrait>,
            any
          >
        >[]
      >
    }) => (isCorrectValue: (value: void) => boolean) => void
    onFetch: (
      accessors: import('..').Accessor<
        import('..').Selection<import('..').DataTrait>,
        import('..').Accessor<
          import('..').Selection<import('..').DataTrait>,
          any
        >
      >[],
      response: Promise<import('..').QueryResponse<any>>,
      variables: Record<string, any> | undefined,
      query: string,
      queryName: string | undefined
    ) => (isCorrectValue: (value: void) => boolean) => void
    dispose: () => (isCorrectValue: (value: void) => boolean) => void
  }
}
export {}
