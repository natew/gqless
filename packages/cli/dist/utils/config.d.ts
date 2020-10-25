export interface Config {
  config?: string
  headers?: Record<string, string>
  url?: string
  outputDir?: string
  comments?: boolean
  typescript?: boolean
}
export declare const getConfig: (
  path?: string | undefined
) => Promise<Config | null>
