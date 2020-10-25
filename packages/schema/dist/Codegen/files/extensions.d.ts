import { File } from '../File'
import { Codegen } from '../Codegen'
export declare class ExtensionsFile extends File {
  private codegen
  constructor(codegen: Codegen)
  generate(): string
}
