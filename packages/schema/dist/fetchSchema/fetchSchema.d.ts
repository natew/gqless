import { QueryFetcher } from 'gqless'
export declare type IFetchSchemaOptions = {
  includeInfo?: boolean
}
export declare const fetchSchema: (
  fetchQuery: QueryFetcher,
  { includeInfo }?: IFetchSchemaOptions
) => Promise<import('..').Schema<any>>
