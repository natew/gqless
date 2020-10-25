import { Value } from '../Value'
export declare const deepReference: (
  rootValue: Value<import('../..').DataTrait>
) => {
  onReference: import('@gqless/utils').Event<(...args: any[]) => any>
  onUnreference: import('@gqless/utils').Event<(...args: any[]) => any>
  dispose(): void
}
