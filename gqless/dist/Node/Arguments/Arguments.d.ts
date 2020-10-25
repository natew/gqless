import { ArrayNode, InputNode, ScalarNode } from '../'
import { EnumNode } from '../EnumNode'
import { ArgumentsField } from './ArgumentsField'
export declare type UArguments =
  | ScalarNode
  | EnumNode
  | ArrayNode<any>
  | ArgumentsField
  | InputNode
declare type UArgumentsRecord = Record<string, ArgumentsField>
export declare class Arguments {
  required: boolean
  inputs: UArgumentsRecord
  constructor(inputs: UArgumentsRecord, required?: boolean)
}
export {}
