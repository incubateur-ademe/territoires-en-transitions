import {
  integer,
  pgTable,
  serial,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createdAt } from '../../utils/column.utils';
import { collectiviteTable } from '../shared/models/collectivite.table';
import { dcpTable } from '../../users/models/dcp.table';

export const instanceGouvernanceTagTable = pgTable(
  'instance_de_gouvernance_tag',
  {
    id: serial('id').primaryKey(),
    nom: varchar('nom', { length: 255 }).notNull(),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id),
    createdAt,
    createdBy: uuid('created_by')
      .notNull()
      .references(() => dcpTable.id),
  },
  (table) => [
    uniqueIndex('instance_de_gouvernance_tag_nom_collectivite_id_key').on(
      table.nom,
      table.collectiviteId
    ),
  ]
);
