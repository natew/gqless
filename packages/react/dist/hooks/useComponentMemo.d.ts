/**
 * createMemo, persisted across all instances of Component
 */
export declare const useComponentMemo: <T>(
  getValue: () => T,
  dependencies?: any[] | undefined
) => T
