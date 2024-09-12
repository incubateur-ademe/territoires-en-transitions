import { pgTable, text } from 'drizzle-orm/pg-core';
import { actionRelationTable } from '../../referentiel/models/action-relation.table';
import { DocumentBase } from './document.basetable';

export const preuveComplementaireTable = pgTable('preuve_complementaire', {
  ...DocumentBase,
  actionId: text('action_id')
    .notNull()
    .references(() => actionRelationTable.id),
});
