export declare const lazyGetters: <T extends Record<any, any>>(
  obj: T,
  onEvaluated?: ((key: keyof T, value: T[keyof T]) => void) | undefined
) => T
