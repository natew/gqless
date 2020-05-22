export const deepJSONEqual = (
  a: any,
  b: any,
  customCompare?: (a: any, b: any) => boolean | undefined
) => {
  const isEqual = customCompare?.(a, b)
  if (isEqual !== undefined) return isEqual

  // Called in JSON.stringify (currently not used internally)
  if (a && typeof a.toJSON === 'function') a = a.toJSON()
  if (b && typeof b.toJSON === 'function') b = b.toJSON()

  if (a === b) return true

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false

    let length: number, i: number, key: string, keys: string[]

    if (Array.isArray(a)) {
      length = a.length

      if (length !== b.length) return false
      for (i = length; i-- !== 0; )
        if (!deepJSONEqual(a[i], b[i], customCompare)) return false
      return true
    }

    keys = Object.keys(a)
    length = keys.length

    if (length !== Object.keys(b).length) return false

    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false

    for (i = length; i-- !== 0; ) {
      key = keys[i]
      if (!deepJSONEqual(a[key], b[key], customCompare)) return false
    }

    return true
  }

  return a !== a && b !== b
}
