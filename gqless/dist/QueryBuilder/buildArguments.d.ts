import { Formatter } from './Formatter'
import { ConnectedVariable } from './buildVariable'
import { Arguments } from '../Node'
export declare const buildArguments: (
  { SPACE, SEPARATOR, options, formatter }: Formatter,
  args: Record<string, any>,
  info?:
    | (Pick<ConnectedVariable, 'variables' | 'path'> & {
        node: Arguments
      })
    | undefined
) => string
