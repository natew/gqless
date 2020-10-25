import { Command, flags } from '@oclif/command'
import { Config } from '../utils/config'
export default class Generate extends Command {
  static description: string
  static examples: string[]
  static flags: {
    help: import('@oclif/parser/lib/flags').IBooleanFlag<void>
    config: flags.IOptionFlag<string | undefined>
    header: flags.IOptionFlag<string | undefined>
    comments: import('@oclif/parser/lib/flags').IBooleanFlag<boolean>
    url: flags.IOptionFlag<string | undefined>
    typescript: import('@oclif/parser/lib/flags').IBooleanFlag<boolean>
  }
  static args: {
    name: string
  }[]
  run(): Promise<void>
  createConfig(): Promise<Config>
}
