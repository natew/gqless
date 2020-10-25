import { Accessor, Interceptor, Scheduler } from 'gqless'
import { StackContext } from '../Query'
export declare const useInterceptor: (
  stack: StackContext
) => {
  interceptor: Interceptor
  schedulers: Set<Scheduler>
  interceptedAccessors: Set<
    Accessor<
      import('gqless').Selection<import('gqless').DataTrait>,
      Accessor<import('gqless').Selection<import('gqless').DataTrait>, any>
    >
  >
  startIntercepting(): void
  stopIntercepting(): void
}
