import { Value } from '../Value'
import {
  EnumNode,
  ObjectNode,
  ScalarNode,
  ArrayNode,
  DataTrait,
  Extension,
  FieldNode,
  UFieldsNode,
  getAbstractImplementation,
} from '../../Node'
import { createValue } from './createValue'
import { Selection, Fragment } from '../../Selection'
import { extensionsForKey } from './extensionsForKey'
import { selectionsForKey } from './selectionsForKey'
import { Cache } from '../Cache'
import { getKeyFromCache } from './getKeyFromCache'

const FIELD_NAME = /^([^(]+)\(?/

/**
 * Merge-updates a value
 * @param value value to update
 * @param data data to merge
 * @param extensions (optional) pass to enable cache keys
 * @param selectionsFilter (optional) pass to filter merging
 *
 * @returns mergeFiltered - merges the data omitted by selectionsFilter
 */
export const merge = (
  cache: Cache,
  value: Value,
  data: any,
  extensions: Extension[] = [],
  ...selectionsFilter: Selection[]
): Function | undefined => {
  if (value.node instanceof ScalarNode || value.node instanceof EnumNode) {
    mergeScalar(value as any, data)
    return
  }

  const wasNull = value.data === null
  const isNull = data === null

  // don't do anything if both are null
  if (wasNull && isNull) return

  // simply update for null
  if (isNull) {
    value.data = null
    return
  }

  if (value.node instanceof ObjectNode) {
    if (wasNull) value.data = {}
    return iterateObject(
      cache,
      value as any,
      data,
      extensions,
      ...selectionsFilter
    )
  }

  if (value.node instanceof ArrayNode) {
    // Update the array length (removing values if needed)
    value.data = wasNull ? [] : (value.data as any[]).slice(0, data.length)
    iterateArray(cache, value as any, data, extensions)
    return
  }
  return
}

const keyedMerge = (
  cache: Cache,
  node: DataTrait,
  data: any,
  extensions: Extension[],
  ...selectionsFilter: Selection[]
) => {
  const keyFragments: Fragment[] = []
  for (const { fragment } of extensions) {
    if (!fragment) continue
    if (keyFragments.includes(fragment)) continue
    keyFragments.push(fragment)
  }
  if (!keyFragments.length) return

  // Create a *temporary* value with the fields needed to perform a key-operation
  const keyedValue = createValue(node, data)

  // Merge only the fields required for a key-op into the new value
  const completeMerge = merge(
    cache,
    keyedValue,
    data,
    extensions,
    ...keyFragments
  )

  // Find a key, and get value from cache
  const result = getKeyFromCache(cache, keyedValue, extensions)

  // No result, discard keyedValue
  if (!result) return

  // If the value was already in the cache,
  // discard keyedValue and merge oncemore
  if (result.value !== keyedValue) {
    merge(cache, result.value, data, extensions, ...selectionsFilter)
  } else {
    // Value wasn't in cache, so merge the rest of data
    // on the keyedValue
    completeMerge?.()
  }

  return result.value
}

const mergeScalar = (value: Value<ScalarNode>, data: any) => {
  // Scalar's can't be keyed, so simply update
  value.data = data
}

const iterateArray = (
  cache: Cache,
  arrayValue: Value<ArrayNode<DataTrait>>,
  data: any[],
  arrayExtensions: Extension[],
  ...selectionsFilter: Selection[]
) => {
  data.forEach((data, key) => {
    const node = arrayValue.node.ofNode
    const nodeImplementation = getAbstractImplementation(node, data?.__typename)
    const extensions = extensionsForKey(
      arrayExtensions,
      (e) => e.childIndex(),
      node,
      nodeImplementation,
      node
    )

    let value = arrayValue.get(key)

    const keyedValue = keyedMerge(
      cache,
      nodeImplementation || node,
      data,
      extensions,
      ...selectionsFilter
    )
    if (keyedValue) {
      arrayValue.set(key, keyedValue)
      return
    }

    if (!value) {
      value = createValue(nodeImplementation || node, data)
      arrayValue.set(key, value)
    }

    merge(cache, value, data, extensions, ...selectionsFilter)
  })
}

const iterateObject = (
  cache: Cache,
  objectValue: Value<ObjectNode>,
  objectData: Record<string, any>,
  objectExtensions: Extension[],
  ...selectionsFilter: Selection[]
) => {
  function mergeObjectKey(key: string, ...filteredSelections: Selection[]) {
    let fieldName = key
    if (!(key in objectValue.node.fields)) {
      fieldName = fieldName.match(FIELD_NAME)?.[1]!
      if (!fieldName || !(fieldName in objectValue.node.fields)) return
    }

    const field = objectValue.node.fields[fieldName] as FieldNode<
      UFieldsNode & DataTrait
    >
    const data = objectData[key]
    const node = field.ofNode
    const nodeImplementation = getAbstractImplementation(node, data?.__typename)
    const extensions = extensionsForKey(
      objectExtensions,
      (e) => e.childField(field),
      nodeImplementation,
      node
    )

    let value = objectValue.get(key)

    const keyedValue = keyedMerge(
      cache,
      nodeImplementation || node,
      data,
      extensions,
      ...filteredSelections
    )
    if (keyedValue) {
      objectValue.set(key, keyedValue)
      return
    }

    if (!value) {
      value = createValue(nodeImplementation || node, data)
      objectValue.set(key, value)
    }

    merge(cache, value, objectData[key], extensions, ...filteredSelections)
  }

  const mergeFiltered: Function[] = []

  for (const key in objectData) {
    if (key === '__typename') continue

    const selections = selectionsForKey(key, ...selectionsFilter)

    // If it's not selected, add to mergeFiltered
    if (selectionsFilter.length && !selections.length) {
      mergeFiltered.push(() => mergeObjectKey(key, ...selections))
      continue
    }

    mergeObjectKey(key, ...selections)
  }

  return mergeFiltered.length
    ? () => {
        for (const merge of mergeFiltered) {
          merge()
        }
      }
    : undefined
}
