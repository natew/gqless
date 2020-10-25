/**
 * Updates the Value for an accessor
 *
 * @example
 * // Update a scalar
 * update(query.me.name, 'bob')
 *
 * // Update an object
 * update(query, { me: { name: 'bob' } })
 */
export declare const update: (data: any, newData: any) => void
