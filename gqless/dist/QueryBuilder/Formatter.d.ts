export interface IFormatterOptions {
  /**
   * Makes the query human readable
   * @default process.env.NODE_ENV === 'development'
   */
  prettify?: boolean
  /**
   * Output GraphQL variables references.
   * If set to false, variable values will be inlined
   * @default false
   */
  variables?: boolean
  /**
   * Whether or not to extract fragments into a shared definition
   * inline: all fragments will be inlined
   * auto: all fragments will be inlined, unless duplicated
   * @default inline
   */
  fragments?: 'auto' | 'inline'
}
export declare class Formatter {
  formatter: this
  options: Required<IFormatterOptions>
  SPACE: string
  SEPARATOR: string
  LINE_SEPARATOR: string
  NEWLINE: string
  constructor({ prettify, variables, fragments }?: IFormatterOptions)
  indent: (string: string) => string
  hug: (string: string) => string
}
