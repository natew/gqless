import { ScalarNode, ArrayNode, UnionNode, EnumNode } from '../../'
import { FieldNode } from './FieldNode'
import { NodeExtension } from '../../Extension'
import { ObjectNode } from '../../ObjectNode'
import { InterfaceNode } from '../../InterfaceNode'
export declare type IFieldsNodeOptions = {
  name: string
  extension?: NodeExtension
}
export declare type UFieldsNode =
  | ObjectNode
  | InterfaceNode
  | UnionNode
  | ArrayNode
  | ScalarNode
  | EnumNode
export declare type UFieldsNodeRecord = Record<string, FieldNode<UFieldsNode>>
export declare class FieldsNode {
  name: string
  fields: UFieldsNodeRecord
  constructor(fields: UFieldsNodeRecord, { name }: IFieldsNodeOptions)
  toString(): string
}
