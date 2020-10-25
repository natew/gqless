import { Extension } from './Extension'
import { Accessor } from '../../Accessor'
import { ComputableExtension } from './ComputableExtension'
export declare class ComputedExtension extends Extension {
  accessor: Accessor
  constructor(parent: ComputableExtension, accessor: Accessor)
  get data(): any
}
