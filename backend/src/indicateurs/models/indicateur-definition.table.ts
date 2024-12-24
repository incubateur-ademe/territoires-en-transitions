import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '../../utils/column.utils';

export const indicateurDefinitionTable = pgTable('indicateur_definition', {
  id: serial('id').primaryKey(),
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
  description: text('description'),
  unite: text('unite').notNull(),
  borneMin: doublePrecision('borne_min'),
  borneMax: doublePrecision('borne_max'),
  participationScore: boolean('participation_score').default(false).notNull(),
  sansValeurUtilisateur: boolean('sans_valeur_utilisateur')
    .default(false)
    .notNull(),
  valeurCalcule: text('valeur_calcule'),
  createdAt,
  modifiedAt,
  createdBy,
  modifiedBy,
});

export const indicateurDefinitionSchema = createSelectSchema(
  indicateurDefinitionTable
);
export type IndicateurDefinition = InferSelectModel<
  typeof indicateurDefinitionTable
>;

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
