export declare class NodeContainer<TNode extends object> {
  ofNode: TNode
  nullable: boolean
  constructor(ofNode: TNode, nullable?: boolean)
  get innerNode(): object
}
