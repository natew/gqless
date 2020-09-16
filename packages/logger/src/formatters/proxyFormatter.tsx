import { ACCESSOR } from '@o/gqless'

import * as React from './jsx'

// TODO: Should instead read cache, instead of accessor children. Why: missing properties
export const proxyFormatter = {
  header(proxy: any) {
    try {
      if (!proxy || !proxy[ACCESSOR]) return null

      // @ts-ignore
      return <object object={proxy[ACCESSOR]} />
    } catch {
      return null
    }
  },

  hasBody() {
    return false
  },
}
