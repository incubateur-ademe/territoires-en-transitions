// Génère, à partir d'un type, un nouveau type dont tous les champs sont non
// null. Utile pour caster le typage de certaines Views exportées par supabase
// gen types
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Génère un type résultant de la concaténation de deux chaînes.
 *
 * Utilisable avec un type union, comme par exemple :
 * ```
 * type TItemId = 'exemples' | 'contexte'
 * type TRPCName = Prefix<'action_', TItemId> // 'action_exemples' | 'action_contexte'
 * ```
 *
 * Ref: https://stackoverflow.com/questions/73135992/add-a-prefix-to-each-type-in-a-string-union-type
 */
export type Prefix<P extends string, S extends string> = `${P}${S}`;
