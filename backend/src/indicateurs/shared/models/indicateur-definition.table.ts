import { collectiviteTable } from '@/backend/collectivites/index-domain';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
  tsvector,
} from '@/backend/utils/index-domain';
import { InferInsertModel, sql, SQL } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const indicateurDefinitionTable = pgTable(
  'indicateur_definition',
  {
    id: serial('id').primaryKey(),
    version: varchar('version', { length: 16 }).notNull().default('1.0.0'),
    groupementId: integer('groupement_id'), // TODO: references
    collectiviteId: integer('collectivite_id').references(
      () => collectiviteTable.id,
      {
        onDelete: 'cascade',
      }
    ),
    identifiantReferentiel: text('identifiant_referentiel').unique(),
    titre: text('titre').notNull(),
    titreLong: text('titre_long'),
    titreCourt: text('titre_court'),
    description: text('description'),
    unite: text('unite').notNull(),
    precision: integer('precision').default(2).notNull(), // Number of decimal in order to round the value
    borneMin: doublePrecision('borne_min'),
    borneMax: doublePrecision('borne_max'),
    participationScore: boolean('participation_score').default(false).notNull(),
    sansValeurUtilisateur: boolean('sans_valeur_utilisateur')
      .default(false)
      .notNull(),
    valeurCalcule: text('valeur_calcule'),
    exprCible: text('expr_cible'),
    exprSeuil: text('expr_seuil'),
    libelleCibleSeuil: text('libelle_cible_seuil'),
    createdAt,
    modifiedAt,
    createdBy,
    modifiedBy,
    fulltextSearch: tsvector('fulltext_search')
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`setweight(to_tsvector('french_custom', coalesce(${indicateurDefinitionTable.titre}, '')), 'A') ||
        setweight(to_tsvector('french_custom', coalesce(${indicateurDefinitionTable.titreLong}, '')), 'A') ||
        setweight(to_tsvector('french_custom', coalesce(${indicateurDefinitionTable.description}, '')), 'B')`
      ),
  },
  (t) => [
    index('indicateur_definition_search_idx').using('gin', t.fulltextSearch),
  ]
);

export const indicateurDefinitionSchema = createSelectSchema(
  indicateurDefinitionTable
).omit({
  fulltextSearch: true,
});
export type IndicateurDefinition = z.infer<typeof indicateurDefinitionSchema>;

export const indicateurDefinitionSchemaInsert = createInsertSchema(
  indicateurDefinitionTable
);
export type IndicateurDefinitionInsert = InferInsertModel<
  typeof indicateurDefinitionTable
>;

export const indicateurDefinitionSchemaEssential =
  indicateurDefinitionSchema.pick({
    id: true,
    identifiantReferentiel: true,
    titre: true,
    titreLong: true,
    description: true,
    unite: true,
    borneMin: true,
    borneMax: true,
  });
export type IndicateurDefinitionEssential = z.infer<
  typeof indicateurDefinitionSchemaEssential
>;

export type IndicateurDefinitionAvecEnfantsType = IndicateurDefinition & {
  enfants: IndicateurDefinition[] | null;
};
