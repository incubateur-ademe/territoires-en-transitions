import { integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { createdAt, createdBy } from '../../utils/column.utils';
import { collectiviteTable } from '../shared/models/collectivite.table';

export const instanceGouvernanceTagTable = pgTable(
  'instance_de_gouvernance_tag',
  {
    id: serial('id').primaryKey(),
    nom: varchar('nom', { length: 255 }).notNull(),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id),
    createdAt,
    createdBy,
  }
);
