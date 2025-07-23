import { modifiedAt } from '@/backend/utils/index-domain';
import {
  doublePrecision,
  pgEnum,
  pgTable,
  text,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { actionTypeIncludingExempleSchema } from './action-type.enum';
import { referentielDefinitionTable } from './referentiel-definition.table';
import { referentielIdPgEnum } from './referentiel-id.enum';
import { sql } from 'drizzle-orm';

export const ActionCategorieEnum = {
  BASES: 'bases',
  MISE_EN_OEUVRE: 'mise en œuvre',
  EFFETS: 'effets',
} as const;

export const actionCategorieEnumSchema = z.enum([
  ActionCategorieEnum.BASES,
  ActionCategorieEnum.MISE_EN_OEUVRE,
  ActionCategorieEnum.EFFETS,
]);

export type ActionCategorie = z.infer<typeof actionCategorieEnumSchema>;

export const actionCategoriePgEnum = pgEnum(
  'action_categorie',
  actionCategorieEnumSchema.options
);

export const actionIdVarchar = varchar('action_id', { length: 30 });
export const actionDefinitionTable = pgTable('action_definition', {
  modifiedAt,
  actionId: actionIdVarchar.primaryKey().notNull(),
  referentiel: referentielIdPgEnum('referentiel').notNull(),
  referentielId: varchar('referentiel_id', { length: 30 })
    .notNull()
    .references(() => referentielDefinitionTable.id),
  referentielVersion: varchar('referentiel_version', { length: 16 }).notNull(),
  identifiant: text('identifiant').notNull(),
  nom: text('nom').notNull(),
  description: text('description').notNull(),
  contexte: text('contexte').notNull(),
  exemples: text('exemples').notNull(),
  ressources: text('ressources').notNull(),
  reductionPotentiel: text('reduction_potentiel').notNull(),
  perimetreEvaluation: text('perimetre_evaluation').notNull(),
  preuve: text('preuve'),
  points: doublePrecision('points'),
  pourcentage: doublePrecision('pourcentage'),
  categorie: actionCategoriePgEnum('categorie'),
  exprScore: text('expr_score'),
});

// Virtual column with the depth of the action depending on the number of dots in the identifiant
// Ex: 1.1   => depth 2
//     1.1.1 => depth 3
export const actionDefinitionDepthColumn = sql<number>`CASE
  WHEN ${actionDefinitionTable.identifiant} IS NULL OR ${actionDefinitionTable.identifiant} LIKE '' THEN 0
  ELSE REGEXP_COUNT(${actionDefinitionTable.identifiant}, '\\.') + 1
  END`.as('depth');

export const actionDefinitionSchema = createSelectSchema(actionDefinitionTable);
export type ActionDefinition = typeof actionDefinitionTable.$inferSelect;

export const actionDefinitionSchemaInsert = createInsertSchema(
  actionDefinitionTable
);
export type ActionDefinitionInsert = typeof actionDefinitionTable.$inferInsert;

export const actionDefinitionSeulementIdObligatoireSchema =
  actionDefinitionSchema.partial();

export const actionDefinitionMinimalWithTypeAndLevel =
  actionDefinitionSchema.extend({
    level: z.number(),
    actionType: actionTypeIncludingExempleSchema,
  });

export type ActionDefinitionMinimalWithTypeAndLevel = z.infer<
  typeof actionDefinitionMinimalWithTypeAndLevel
>;

export const mesureIdSchema = z.string();
export type MesureId = z.infer<typeof mesureIdSchema>;
