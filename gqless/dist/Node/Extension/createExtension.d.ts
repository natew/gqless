import { DataTrait } from '../traits'
import { StaticExtension, ComputableExtension } from '.'
import { Extension } from './Extension'
export declare const createExtension: (
  node: DataTrait,
  extension: any,
  parent?: Extension | undefined,
  keyedBy?: any
) => ComputableExtension | StaticExtension
