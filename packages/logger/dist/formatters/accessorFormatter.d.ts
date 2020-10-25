import { Accessor } from 'gqless'
export declare const accessorFormatter: {
  header(accessor: any, config?: any): JSX.Element | null
  body(
    accessor: Accessor<
      import('gqless').Selection<import('gqless').DataTrait>,
      Accessor<import('gqless').Selection<import('gqless').DataTrait>, any>
    >
  ): JSX.Element
  hasBody(
    accessor: Accessor<
      import('gqless').Selection<import('gqless').DataTrait>,
      Accessor<import('gqless').Selection<import('gqless').DataTrait>, any>
    >
  ): boolean
}
