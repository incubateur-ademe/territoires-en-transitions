import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '@/backend/utils/column.utils';
import { InferInsertModel } from 'drizzle-orm';
import {
  boolean,
  date,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import {
  IndicateurDefinition,
  indicateurDefinitionSchemaTiny,
  indicateurDefinitionTable,
} from '../definitions/indicateur-definition.table';
import {
  indicateurSourceMetadonneeTable,
  SourceMetadonnee,
  sourceMetadonneeSchema,
} from '../shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceSchema } from '../shared/models/indicateur-source.table';

export const indicateurValeurTable = pgTable('indicateur_valeur', {
  id: serial('id').primaryKey(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id, {
      onDelete: 'cascade',
    }),
  indicateurId: integer('indicateur_id')
    .notNull()
    .references(() => indicateurDefinitionTable.id, {
      onDelete: 'cascade',
    }),
  dateValeur: date('date_valeur').notNull(),
  metadonneeId: integer('metadonnee_id').references(
    () => indicateurSourceMetadonneeTable.id,
    {
      onDelete: 'cascade',
    }
  ),
  resultat: doublePrecision('resultat'),
  resultatCommentaire: text('resultat_commentaire'),
  objectif: doublePrecision('objectif'),
  objectifCommentaire: text('objectif_commentaire'),
  estimation: doublePrecision('estimation'),
  calculAuto: boolean('calcul_auto').default(false),
  calculAutoIdentifiantsManquants: text(
    'calcul_auto_identifiants_manquants'
  ).array(),
  createdAt,
  modifiedAt,
  createdBy,
  modifiedBy,
});

export const indicateurValeurSchema = createSelectSchema(indicateurValeurTable);
export type IndicateurValeur = z.infer<typeof indicateurValeurSchema>;

export type IndicateurValeurWithIdentifiant = IndicateurValeur & {
  indicateurIdentifiant?: string | null;
  sourceId?: string | null;
};

export const indicateurValeurSchemaInsert = createInsertSchema(
  indicateurValeurTable
);
export type IndicateurValeurInsert = InferInsertModel<
  typeof indicateurValeurTable
>;

export const indicateurValeurGroupeeSchema = indicateurValeurSchema
  .pick({
    id: true,
    collectiviteId: true,
    dateValeur: true,
    resultat: true,
    resultatCommentaire: true,
    objectif: true,
    objectifCommentaire: true,
    metadonneeId: true,
    calculAuto: true,
    calculAutoIdentifiantsManquants: true,
  })
  .partial({
    resultat: true,
    resultatCommentaire: true,
    objectif: true,
    objectifCommentaire: true,
    metadonneeId: true,
    calculAuto: true,
    calculAutoIdentifiantsManquants: true,
  })
  .extend({
    confidentiel: z.boolean().nullish(),
  });

export type IndicateurValeurGroupee = z.infer<
  typeof indicateurValeurGroupeeSchema
>;

export const indicateurAvecValeursSchema = z
  .object({
    definition: indicateurDefinitionSchemaTiny,
    valeurs: z.array(indicateurValeurGroupeeSchema),
  })
  .describe('Indicateur définition et valeurs ordonnées par date');

export type IndicateurAvecValeurs = z.infer<typeof indicateurAvecValeursSchema>;

export const indicateurValeursGroupeeParSourceSchema = z
  .object({
    source: z.string(),
    metadonnees: z.array(sourceMetadonneeSchema),
    valeurs: z.array(indicateurValeurGroupeeSchema),
    ordreAffichage: indicateurSourceSchema.shape.ordreAffichage,
    libelle: indicateurSourceSchema.shape.libelle,
  })
  .describe('Indicateur valeurs pour une source donnée');

export type IndicateurValeursGroupeeParSource = z.infer<
  typeof indicateurValeursGroupeeParSourceSchema
>;

export const indicateurAvecValeursParSourceSchema = z
  .object({
    definition: indicateurDefinitionSchemaTiny,
    sources: z.record(z.string(), indicateurValeursGroupeeParSourceSchema),
  })
  .describe('Filtre de récupération des valeurs des indicateurs');

export type IndicateurAvecValeursParSource = z.infer<
  typeof indicateurAvecValeursParSourceSchema
>;

export interface IndicateurValeurAvecMetadonnesDefinition {
  indicateur_valeur: IndicateurValeur;

  indicateur_definition: IndicateurDefinition | null;

  indicateur_source_metadonnee: SourceMetadonnee | null;

  confidentiel?: boolean | null;
}
