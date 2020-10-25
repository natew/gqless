/// <reference types="react" />
import { VariantFragments } from '../hooks/useComponentContext'
import { Accessor, Fragment } from 'gqless'
export declare type Variant = [Accessor, Fragment][]
export declare const VariantContext: import('react').Context<Variant>
export declare const useFragments: () => {
  variantFragments: VariantFragments
  startResolving(): void
  stopResolving(): void
  getRenderVariants(): Variant[]
}
