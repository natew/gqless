import { Query } from 'gqless'
export interface IGraphQLOptions {
  name?: string
  seperateRequest?: boolean
  /**
   * Whether or not child components can use their own queries.
   *
   * true  | child components can use their own queries
   * false | all queries will be merged into this components query
   * null  | (default) inherited with React context
   */
  allowInheritance?: boolean | null
}
export declare const graphql: <Props extends any>(
  component: (props: Props) => any,
  { name, allowInheritance, seperateRequest }?: IGraphQLOptions
) => {
  (props: Props): any
  displayName: string
  query: Query
}
