import { Extension, DataTrait } from '../../Node'
export declare const extensionsForKey: (
  extensions: Extension[],
  get: (e: Extension) => Extension | undefined,
  ...nodes: DataTrait[]
) => Extension[]
