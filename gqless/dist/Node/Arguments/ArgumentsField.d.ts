import { NodeContainer } from '../abstract'
import { UArguments } from './Arguments'
export declare class ArgumentsField extends NodeContainer<UArguments> {
  name: string
  constructor(node: UArguments, nullable?: boolean)
}
