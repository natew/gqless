import { Accessor } from './Accessor'
export declare type AccessorInterceptor = (accessor: Accessor) => void
export declare const accessorInterceptors: Set<AccessorInterceptor>
export declare class Interceptor {
  listening: boolean
  onAccessor: import('@gqless/utils').Event<(...args: any[]) => any>
  start(): void
  stop(): void
}
