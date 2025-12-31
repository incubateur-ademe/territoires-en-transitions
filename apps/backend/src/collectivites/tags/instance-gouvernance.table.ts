import { integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { createdAt, createdBy } from '../../utils/column.utils';
import { collectiviteTable } from '../shared/models/collectivite.table';

export const instanceGouvernanceTable = pgTable('instance_de_gouvernance', {
  id: serial('id').primaryKey(),
  nom: varchar('nom', { length: 255 }).notNull(),
  collectiviteId: integer('collectivite_id').references(
    () => collectiviteTable.id
  ),
  createdAt,
  createdBy,
});
