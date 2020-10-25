import { UArguments } from '../Node'
export interface IVariableOptions {
  node?: UArguments
  nullable?: boolean
  /**
   * GraphQL variable name to use.
   *
   * Conflicts are handled automatically
   */
  name?: string
}
export declare class Variable<TValue = any> {
  options: IVariableOptions
  node?: UArguments
  value?: TValue
  nullable?: boolean
  name?: string
  constructor(value?: TValue, options?: IVariableOptions)
  updateValue(value?: TValue): void
  updateNullable(nullable: boolean): void
  validateNode(node: UArguments, nullable?: boolean): void
  toString(): string
  toJSON(): TValue | undefined
}
