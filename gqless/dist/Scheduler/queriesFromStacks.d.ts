/**
 * This algorithmn take a stack of queries, and determines
 * what query each stack should use
 * eg.
 *  [App, Profile] => Profile
 *  [App, Profile, Name] => Profile
 *  [App, Navbar] => App
 *  [App, Profile, Name] => App
 * I'm sure this could be optimized further but it was a pain to get working
 */
export declare const queriesFromStacks: <T extends any>(stacks: T[][]) => T[]
