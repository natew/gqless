import { ArrayNode } from '../ArrayNode'
import { EnumNode } from '../EnumNode'
import { ScalarNode } from '../ScalarNode'
import { InputNodeField } from './InputNodeField'
export declare type UInputNode = ScalarNode | ArrayNode | InputNode | EnumNode
declare type UInputNodeRecord = Record<string, InputNodeField>
export declare type IInputNodeOptions = {
  name: string
}
export declare class InputNode {
  name?: string
  inputs: UInputNodeRecord
  constructor(inputs: UInputNodeRecord, { name }: IInputNodeOptions)
  toString(): string
}
export {}
