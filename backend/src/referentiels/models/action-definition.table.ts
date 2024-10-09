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
import { referentielList } from './referentiel.enum';

// Todo: change it reference another table instead
export const referentielEnum = pgEnum('referentiel', referentielList);
export const actionCategorieEnum = pgEnum('action_categorie', [
  'bases',
  'mise en œuvre',
  'effets',
]);
export const actionIdVarchar = varchar('action_id', { length: 30 });
export const actionIdReference = actionIdVarchar.references(
  () => actionDefinitionTable.action_id
);

export const actionDefinitionTable = pgTable('action_definition', {
  modified_at: timestamp('modified_at', { withTimezone: true, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  action_id: actionIdVarchar.primaryKey().notNull(),
  referentiel: referentielEnum('referentiel').notNull(),
  identifiant: text('identifiant').notNull(),
  nom: text('nom').notNull(),
  description: text('description').notNull(),
  contexte: text('contexte').notNull(),
  exemples: text('exemples').notNull(),
  ressources: text('ressources').notNull(),
  reduction_potentiel: text('reduction_potentiel').notNull(),
  perimetre_evaluation: text('perimetre_evaluation').notNull(),
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
    action_type: z.nativeEnum(ActionType),
  });

export const createActionDefinitionSchema = createInsertSchema(
  actionDefinitionTable
);

export type ActionDefinitionAvecParentType = Pick<
  ActionDefinitionType,
  'action_id'
> &
  Partial<ActionDefinitionType> & {
    parent_action_id: string | null;
  };
