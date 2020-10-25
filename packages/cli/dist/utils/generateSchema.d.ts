import { Config } from './config'
import { QueryFetcher } from 'gqless'
export declare const generateSchema: (
  fetchQuery: QueryFetcher,
  options: Config & {
    outputDir: string
  }
) => Promise<void>
