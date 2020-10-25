import { Variable } from 'gqless'
export declare function useVariable<TValue>(
  value: TValue,
  name?: string
): Variable<TValue>
export declare function useVariable<TValue>(
  value: TValue,
  nullable?: boolean,
  name?: string
): Variable<TValue>
