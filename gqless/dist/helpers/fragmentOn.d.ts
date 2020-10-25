import { Fragment } from '../Selection'
/**
 * Attaches a fragment to an accessor, and returns the data
 *
 * @example
 * fragmentOn(query.me, new Fragment(schema.User))
 */
export declare const fragmentOn: (
  data: any,
  fragment: Fragment<import('../Selection').UFragment>
) => any
