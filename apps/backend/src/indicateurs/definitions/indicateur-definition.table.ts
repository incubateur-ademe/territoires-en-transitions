import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
  version,
} from '@/backend/utils/column.utils';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';

export const indicateurDefinitionTable = pgTable('indicateur_definition', {
  id: serial('id').primaryKey(),
  version,
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
});

export const indicateurDefinitionSchema = createSelectSchema(
  indicateurDefinitionTable
);

export type IndicateurDefinition = z.infer<typeof indicateurDefinitionSchema>;

export const indicateurDefinitionSchemaTiny = indicateurDefinitionSchema.pick({
  id: true,
  identifiantReferentiel: true,
  titre: true,
  titreLong: true,
  description: true,
  unite: true,
  borneMin: true,
  borneMax: true,
});

export type IndicateurDefinitionTiny = z.infer<
  typeof indicateurDefinitionSchemaTiny
>;

export type IndicateurDefinitionAvecEnfants = IndicateurDefinition & {
  enfants: IndicateurDefinition[] | null;
};
