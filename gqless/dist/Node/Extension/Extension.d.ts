import { FieldNode } from '../abstract'
import { UFragment, Fragment } from '../../Selection'
import { DataTrait } from '../traits'
import { Accessor } from '../../Accessor'
import { Value } from '../../Cache'
export declare abstract class Extension {
  parent: Extension | undefined
  node: DataTrait
  /** (optional) An object used to construct fragmentKey */
  private fragmentKeyedBy
  data: any
  constructor(
    parent: Extension | undefined,
    node: DataTrait,
    /** (optional) An object used to construct fragmentKey */
    fragmentKeyedBy?: any
  )
  /** A unique key to share instances of a Fragment between extensions */
  protected get fragmentKey(): any[]
  get fragment(): Fragment<UFragment> | undefined
  get isKeyable(): boolean
  getKey(value: Value): any
  redirect(accessor: Accessor): Value<DataTrait> | undefined
  /** Returns a memoized child Extension */
  childIndex(): Extension | undefined
  /** Returns a memoized child Extension, for a given field */
  childField(field: FieldNode): Extension | undefined
  toString(): string
  get path(): Extension[]
}
