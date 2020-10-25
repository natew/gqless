import { Accessor } from '../Accessor'
import { Value } from '../../Cache'
export declare const syncValue: (
  accessor: Accessor<
    import('../..').Selection<import('../..').DataTrait>,
    Accessor<import('../..').Selection<import('../..').DataTrait>, any>
  >,
  getFromValue:
    | string
    | ((
        accessorValue: Value<import('../..').DataTrait>
      ) => Value<import('../..').DataTrait> | undefined),
  withAccessor?:
    | Accessor<
        import('../..').Selection<import('../..').DataTrait>,
        Accessor<import('../..').Selection<import('../..').DataTrait>, any>
      >
    | undefined
) => void
