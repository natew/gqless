interface ResolvedOptions {
  waitForUpdate?: boolean
  refetch?: boolean
}
/**
 * Waits for an accessor / function to be fully resolved,
 * and returns the final value
 *
 * @example
 * const name = await resolved(query.me.name)
 * console.log(name)
 *
 * @example
 * const data = await resolved(() => ({ name: query.me.name }))
 * console.log(data.name)
 *
 * @example
 * await resolved(query.me.name)
 * console.log(query.me.name)
 */
export declare function resolved<T>(
  data: T,
  options?: ResolvedOptions
): Promise<T extends (...args: any[]) => infer U ? U : T>
export {}
