import { Variable } from '../Variable'
import { UArguments } from '../Node'
import { Formatter } from './Formatter'
export declare type Variables = Map<string, Variable>
export interface ConnectedVariable {
  node?: UArguments
  nullable?: boolean
  variables?: Map<string, Variable>
  path?: string[]
}
export declare const buildVariable: (
  { options }: Formatter,
  variable: Variable<any>,
  info?: ConnectedVariable | undefined
) => string
