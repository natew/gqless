import { Selection } from 'gqless'
export declare const selectionFormatter: {
  header(selection: any, config?: any): JSX.Element | null
  body(
    selection: Selection<import('gqless').DataTrait>,
    config?: any
  ): JSX.Element
  hasBody(selection: Selection<import('gqless').DataTrait>): boolean
}
