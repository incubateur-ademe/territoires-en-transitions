import { collectiviteTable } from '@/domain/collectivites';
import { createdAt, createdBy, modifiedAt, modifiedBy } from '@/domain/utils';
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
import { indicateurCollectiviteSchema } from './indicateur-collectivite.table';

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
  titreCourt: text('titre_court'),
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

export const indicateurDefinitionDetailleeSchema = indicateurDefinitionSchema
  .merge(
    indicateurCollectiviteSchema.pick({
      commentaire: true,
      confidentiel: true,
      favoris: true,
    })
  )
  .omit({ identifiantReferentiel: true })
  .extend({
    identifiant: indicateurDefinitionSchema.shape.identifiantReferentiel,
    categories: z.string().array(),
    thematiques: z.string().array(),
    enfants: indicateurDefinitionSchema
      .pick({
        id: true,
        identifiantReferentiel: true,
        titre: true,
        titreCourt: true,
      })
      .array()
      .nullable(),
    actions: z.string().array(),
    hasOpenData: z.boolean(),
    estPerso: z.boolean(),
    estAgregation: z.boolean(),
  });

export type IndicateurDefinitionDetaillee = z.infer<
  typeof indicateurDefinitionDetailleeSchema
>;
