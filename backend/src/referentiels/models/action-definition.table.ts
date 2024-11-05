import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import {
  doublePrecision,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { ActionType } from './action-type.enum';
import { referentielDefinitionTable } from './referentiel-definition.table';
import { referentielList } from './referentiel.enum';

// Todo: change it reference another table instead
export const referentielEnum = pgEnum('referentiel', referentielList);

export enum ActionCategoryType {
  BASES = 'bases',
  MISE_EN_OEUVRE = 'mise en œuvre',
  EFFETS = 'effets',
}
export const actionCategorieEnum = pgEnum('action_categorie', [
  ActionCategoryType.BASES,
  ActionCategoryType.MISE_EN_OEUVRE,
  ActionCategoryType.EFFETS,
]);
export const actionIdVarchar = varchar('action_id', { length: 30 });
export const actionIdReference = actionIdVarchar.references(
  () => actionDefinitionTable.actionId
);

export const actionDefinitionTable = pgTable('action_definition', {
  modified_at: timestamp('modified_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  actionId: actionIdVarchar.primaryKey().notNull(),
  referentiel: referentielEnum('referentiel').notNull(),
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
  categorie: actionCategorieEnum('categorie'),
});

export type ActionDefinitionType = InferSelectModel<
  typeof actionDefinitionTable
>;
export type CreateActionDefinitionType = InferInsertModel<
  typeof actionDefinitionTable
>;

export const actionDefinitionSchema = createSelectSchema(actionDefinitionTable);
export const actionDefinitionSeulementIdObligatoireSchema =
  actionDefinitionSchema.partial();
export const actionDefinitionMinimalWithTypeLevel =
  actionDefinitionSchema.extend({
    level: z.number(),
    actionType: z.nativeEnum(ActionType),
  });

export const createActionDefinitionSchema = createInsertSchema(
  actionDefinitionTable
);

export enum ImportActionDefinitionCoremeasureType {
  COREMEASURE = 'coremeasure',
}

export const importActionDefinitionSchema = createActionDefinitionSchema
  .partial({
    actionId: true,
    description: true,
    nom: true,
    contexte: true,
    exemples: true,
    ressources: true,
    referentiel: true,
    referentielId: true,
    referentielVersion: true,
    reductionPotentiel: true,
    perimetreEvaluation: true,
  })
  .extend({
    categorie: z
      .string()
      .toLowerCase()
      .pipe(z.nativeEnum(ActionCategoryType))
      .optional(),
    origine: z.string().optional(),
    coremeasure: z.string().optional(),
  });
export type ImportActionDefinitionType = z.infer<
  typeof importActionDefinitionSchema
>;

export type ActionDefinitionAvecParentType = Pick<
  ActionDefinitionType,
  'actionId'
> &
  Partial<ActionDefinitionType> & {
    parentActionId: string | null;
  };
