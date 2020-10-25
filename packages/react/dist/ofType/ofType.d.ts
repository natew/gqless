export declare function ofType<
  TData extends {
    __typename: string
  },
  T extends TData['__typename']
>(
  data: TData,
  typename: T
): data is TData & {
  __typename: T
}
