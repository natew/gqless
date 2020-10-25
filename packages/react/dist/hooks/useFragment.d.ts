declare type OfType<TData, TTypename> = TData extends {
  __typename: TTypename
}
  ? TData
  : never
/**
 * Creates a new fragment (same across all instances of component)
 */
export declare function useFragment<
  TData extends {
    __typename: string
  },
  TTypename extends TData['__typename'] = never
>(
  data: TData,
  onType?: TTypename,
  fragmentName?: string
): OfType<TData, TTypename> extends never ? TData : OfType<TData, TTypename>
export {}
