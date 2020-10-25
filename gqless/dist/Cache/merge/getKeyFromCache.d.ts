import { Value } from '../Value'
import { Extension } from '../../Node'
import { Cache } from '../Cache'
export declare const getKeyFromCache: (
  cache: Cache,
  value: Value<import('../../Node').DataTrait>,
  extensions: Extension[]
) =>
  | {
      key: any
      value: Value<import('../../Node').DataTrait>
    }
  | undefined
