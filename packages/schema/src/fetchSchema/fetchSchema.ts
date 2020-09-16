import { QueryFetcher } from '@o/gqless'

import { introspectionQuery } from './introspectionQuery'
import { introspectionToSchema } from './introspectionToSchema'

export type IFetchSchemaOptions = {
  includeInfo?: boolean
}

export const fetchSchema = async (
  fetchQuery: QueryFetcher,
  { includeInfo }: IFetchSchemaOptions = {}
) => {
  const { data } = await fetchQuery(introspectionQuery(includeInfo))

  return introspectionToSchema(data.__schema)
}
