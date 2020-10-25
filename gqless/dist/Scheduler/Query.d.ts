export declare class Query {
  name?: string | undefined
  static instances: Map<string | undefined, Query>
  constructor(
    name?: string | undefined,
    /**
     * By default, queries with the same name
     * will refer to the same query.
     * Set this to true to disable
     */
    unique?: boolean
  )
  toString(): string
}
