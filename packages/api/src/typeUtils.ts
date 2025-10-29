import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

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
export type CompositeTypes<
  T extends keyof Database['public']['CompositeTypes']
> = Database['public']['CompositeTypes'][T];

// un exemple de type d'objet tag associé à une collectivité
export type CollectiviteTag =
  Database['public']['Tables']['partenaire_tag']['Insert'];

export type TableTag =
  | 'financeur_tag'
  | 'libre_tag'
  | 'partenaire_tag'
  | 'personne_tag'
  | 'service_tag'
  | 'structure_tag';

export type MesCollectivites = Views<'mes_collectivites'>;

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
 * À utiliser uniquement pour typer les clients Supabase.
 * Ne PAS utiliser pour extraire des types spécifiques.
 */
export type { Database };
