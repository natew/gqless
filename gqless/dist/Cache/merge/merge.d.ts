import { Value } from '../Value'
import { DataTrait, Extension } from '../../Node'
import { Selection } from '../../Selection'
import { Cache } from '../Cache'
/**
 * Merge-updates a value
 * @param value value to update
 * @param data data to merge
 * @param extensions (optional) pass to enable cache keys
 * @param selectionsFilter (optional) pass to filter merging
 *
 * @returns mergeFiltered - merges the data omitted by selectionsFilter
 */
export declare const merge: (
  cache: Cache,
  value: Value<DataTrait>,
  data: any,
  extensions?: Extension[],
  ...selectionsFilter: Selection<DataTrait>[]
) => Function | undefined
