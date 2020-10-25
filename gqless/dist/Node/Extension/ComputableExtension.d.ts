import { Extension } from './Extension'
import { UNodeExtension } from './NodeExtension'
import { DataTrait } from '../traits'
export declare class ComputableExtension extends Extension {
  getData: (data: any) => UNodeExtension
  constructor(
    parent: Extension | undefined,
    node: DataTrait,
    getData: (data: any) => UNodeExtension,
    keyedBy?: any
  )
  get data(): unknown
}
