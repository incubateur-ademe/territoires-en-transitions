import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { foreignKey, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { actionIdVarchar } from '../../../referentiels/models/action-definition.table';
import { actionRelationTable } from '../../../referentiels/models/action-relation.table';
import { preuveReglementaireDefinitionTable } from './preuve-reglementaire-definition.table';
import { preuveIdVarchar } from './preuve-reglementaire.table';

export const preuveActionTable = pgTable(
  'preuve_action',
  {
    preuveId: preuveIdVarchar.notNull(),
    actionId: actionIdVarchar.notNull(),
  },
  (table) => {
    return {
      preuveActionActionIdFkey: foreignKey({
        columns: [table.actionId],
        foreignColumns: [actionRelationTable.id],
        name: 'preuve_action_action_id_fkey',
      }),
      preuveActionPreuveIdFkey: foreignKey({
        columns: [table.preuveId],
        foreignColumns: [preuveReglementaireDefinitionTable.id],
        name: 'preuve_action_preuve_id_fkey',
      }),
      preuveActionPkey: primaryKey({
        columns: [table.preuveId, table.actionId],
        name: 'preuve_action_pkey',
      }),
    };
  }
);

export type PreuveActionType = InferSelectModel<typeof preuveActionTable>;
export type CreatePreuveActionType = InferInsertModel<typeof preuveActionTable>;
export const preuveActionSchema = createSelectSchema(preuveActionTable);
export const createPreuveActionSchema = createInsertSchema(preuveActionTable);
