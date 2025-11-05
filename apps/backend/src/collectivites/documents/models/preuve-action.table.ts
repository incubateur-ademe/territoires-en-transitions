import { foreignKey, pgTable, primaryKey } from 'drizzle-orm/pg-core';
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
  (table) => [
    foreignKey({
      columns: [table.actionId],
      foreignColumns: [actionRelationTable.id],
      name: 'preuve_action_action_id_fkey',
    }),
    foreignKey({
      columns: [table.preuveId],
      foreignColumns: [preuveReglementaireDefinitionTable.id],
      name: 'preuve_action_preuve_id_fkey',
    }),
    primaryKey({
      columns: [table.preuveId, table.actionId],
      name: 'preuve_action_pkey',
    }),
  ]
);
