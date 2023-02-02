// Génère, à partir d'un type, un nouveau type dont tous les champs sont non
// null. Utile pour caster le typage de certaines Views exportées par supabase
// gen types
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};
