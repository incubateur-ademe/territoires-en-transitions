import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/models/collectivite.table';
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

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
  modifiedAt: timestamp('modified_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(), // with time zone default CURRENT_TIMESTAMP
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(), // with time zone default CURRENT_TIMESTAMP
  modifiedBy: uuid('modified_by'), // TODO: default auth.uid() references auth.users
  createdBy: uuid('created_by'), // TODO: default auth.uid() references auth.users
});
export type IndicateurDefinitionType = InferSelectModel<
  typeof indicateurDefinitionTable
>;
export type CreateIndicateurDefinitionType = InferInsertModel<
  typeof indicateurDefinitionTable
>;
export const indicateurDefinitionSchema = createSelectSchema(
  indicateurDefinitionTable
);
export const createIndicateurDefinitionSchema = createInsertSchema(
  indicateurDefinitionTable
);
export const minimaleIndicateurDefinitionSchema =
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
export type MinimalIndicateurDefinitionType = z.infer<
  typeof minimaleIndicateurDefinitionSchema
>;
