import { SelectionTree } from './SelectionTree'
/**
 * Resolves aliases from a JSON object, back into cache-compatible
 * keys
 *
 * eg. user -> user(id: 100)
 */
export declare function resolveAliases(this: SelectionTree, data: any): void
