import { Database } from './database.types.ts';

// Alias génériques sur le typage de la base
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Insert'];

// Génère, à partir d'un type, un nouveau type dont tous les champs sont non
// null. Utile pour caster le typage de certaines Views exportées par supabase
// gen types
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};
