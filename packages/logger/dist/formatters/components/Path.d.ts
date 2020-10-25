export declare function Path<
  T extends {
    node: any
  }
>({
  path,
  isRoot,
  isFragment,
  objectDepth,
}: {
  path: T[]
  objectDepth: number
  isRoot?(element: T): boolean
  isFragment?(element: T): boolean
}): JSX.Element
