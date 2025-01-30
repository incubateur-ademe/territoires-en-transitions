import { modifiedAt } from '@/domain/utils';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  doublePrecision,
  pgEnum,
  pgTable,
  text,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { ActionType } from './action-type.enum';
import { referentielDefinitionTable } from './referentiel-definition.table';
import { referentielIdPgEnum } from './referentiel-id.enum';

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

export const actionDefinitionSchemaInsert = createInsertSchema(
  actionDefinitionTable
);

export enum ImportActionDefinitionCoremeasureType {
  COREMEASURE = 'coremeasure',
}

export const importActionDefinitionSchema = actionDefinitionSchemaInsert
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
      .pipe(z.nativeEnum(ActionCategorieEnum))
      .optional(),
    origine: z.string().optional(),
    coremeasure: z.string().optional(),
    desactivation: z.string().optional(),
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
