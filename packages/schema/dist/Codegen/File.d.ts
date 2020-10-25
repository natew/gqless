export declare const CORE = 'gqless'
export declare const UTILS = '@gqless/utils'
export declare abstract class File {
  path: string
  overwrite: boolean
  constructor(path: string, overwrite?: boolean)
  private imports
  private importAlls
  protected import(from: string, ...imports: string[]): void
  protected importAll(from: string, as: string): void
  generate(): string
}
