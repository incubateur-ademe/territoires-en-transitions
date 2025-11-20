import { actionIdReference } from '@tet/backend/referentiels/models/action-relation.table';
import { pgTable, text } from 'drizzle-orm/pg-core';

export const personnalisationTable = pgTable('personnalisation', {
  actionId: actionIdReference.primaryKey().notNull(),
  titre: text('titre').notNull(),
  description: text('description').notNull(),
});
