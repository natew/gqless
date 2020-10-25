import { File } from '../File'
import { Codegen } from '../Codegen'
export declare class ClientFile extends File {
  private codegen
  constructor(codegen: Codegen)
  generate(): string
}
