import { Value } from '../Value'
import { keyIsValid, Extension } from '../../Node'
import { NodeEntry } from '../NodeEntry'
import { Cache } from '../Cache'

export const getKeyFromCache = (cache: Cache, value: Value) => {
  const node = value.node

  let entry = cache.entries.get(node)

  // Iterate through extensions and call GET_KEY
  // if the key exists in the cache, then return it
  // else create a new cache entry
  let preferedKey: unknown

  // no keyed extension found
  if (!keyIsValid(preferedKey) || !value) return

  if (!entry) {
    entry = new NodeEntry(node)
    cache.entries.set(node, entry)
  }

  // add a new key to cache
  entry.keys.set(preferedKey, value)

  return { key: preferedKey, value }
}
