import { Extension } from './Extension'
import { UNodeExtension } from './NodeExtension'
import { DataTrait } from '../traits'
export declare class StaticExtension extends Extension {
  data: UNodeExtension
  constructor(
    parent: Extension | undefined,
    node: DataTrait,
    data: UNodeExtension,
    keyedBy?: any
  )
}
