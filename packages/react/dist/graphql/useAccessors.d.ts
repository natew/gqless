import { Accessor } from 'gqless'
import { StackContext } from '../Query'
export declare const useAccessors: (
  stack: StackContext
) => {
  accessors: Set<
    Accessor<
      import('gqless').Selection<import('gqless').DataTrait>,
      Accessor<import('gqless').Selection<import('gqless').DataTrait>, any>
    >
  >
  updateAccessors(): void | Promise<void>
  interceptor: import('gqless').Interceptor
  schedulers: Set<import('gqless').Scheduler>
  interceptedAccessors: Set<
    Accessor<
      import('gqless').Selection<import('gqless').DataTrait>,
      Accessor<import('gqless').Selection<import('gqless').DataTrait>, any>
    >
  >
  startIntercepting(): void
  stopIntercepting(): void
}
