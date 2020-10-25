export declare function Preview<T extends any>({
  elements,
  colon,
  objectDepth,
  isFragment,
}: {
  elements: T[]
  objectDepth: number
  colon?: boolean
  isFragment?: (element: T) => boolean
}): JSX.Element
