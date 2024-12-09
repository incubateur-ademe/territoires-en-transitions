import { actionRelationTable } from '@/backend/referentiels';
import { pgTable, text } from 'drizzle-orm/pg-core';
import { DocumentBase } from './document.basetable';

export const preuveComplementaireTable = pgTable('preuve_complementaire', {
  ...DocumentBase,
  actionId: text('action_id')
    .notNull()
    .references(() => actionRelationTable.id),
});
