import {createClient} from '@supabase/supabase-js';
import {Database} from './database.types';

// client supabase avec le typage de la base
export type DBClient = ReturnType<typeof createClient<Database>>;

// liste des noms de table du schéma public
export type TableName = keyof Database['public']['Tables'];

// Alias génériques sur le typage de la base
export type Tables<T extends TableName> =
  Database['public']['Tables'][T]['Row'];
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
export type TablesInsert<T extends TableName> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends TableName> =
  Database['public']['Tables'][T]['Update'];
export type CompositeTypes<
  T extends keyof Database['public']['CompositeTypes']
> = Database['public']['CompositeTypes'][T];

// un exemple de type d'objet tag associé à une collectivité
export type CollectiviteTag = Database['public']['Tables']['partenaire_tag']['Insert'];

// la liste des tables correspondant au schéma CollectiviteTag
// utilise le "key remapping" et les types conditionnels
// Ref: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#key-remapping-via-as
//      https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
export type TableTag = keyof {
  [K in TableName as TablesInsert<K> extends CollectiviteTag ? K : never]: unknown;
};

/**
  Génère, à partir d'un type, un nouveau type dont tous les champs sont non
  null. Utile pour caster le typage de certaines Views exportées par supabase
  gen-types.
 */
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

/**
 * Génère un type union à partir des valeurs d'un tableau de chaînes.
 *
 * Exemple :
 * ```
 * const myArray = ['val1', 'val2'] as const
 * type MyUnion = ValuesToUnion<typeof myArray> // = 'val1' | 'val2
 * ```
 */
export type ValuesToUnion<T extends readonly string[]> = T[number];
