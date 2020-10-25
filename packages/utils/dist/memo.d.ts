/**
 * Memory-leak free memoization
 */
export declare function createMemo(): {
  <T = any>(dependencies: any[]): T | undefined
  <T_1>(get: () => T_1, dependencies?: any[] | undefined): T_1
} & Record<
  string,
  {
    <T = any>(dependencies: any[]): T | undefined
    <T_1>(get: () => T_1, dependencies?: any[] | undefined): T_1
  }
>
