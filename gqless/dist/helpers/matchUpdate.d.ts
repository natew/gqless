/**
 * Updates an accessor, with a compatible Value matching a pattern
 *
 * @example
 * // true for correct matches
 * matchUpdate(query.me, { id: 'Bob' })
 * // => true
 *
 * // returns false for bad matches
 * matchUpdate(query.me, { id: 'no' })
 * // => false
 */
export declare const matchUpdate: (data: any, pattern: any) => boolean
