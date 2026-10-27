import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { createdAt } from '@tet/backend/utils/column.utils';
import { date, index, integer, pgTable, uuid } from 'drizzle-orm/pg-core';

export const pcaetDateSaisineTable = pgTable(
  'demarche_pcaet_date_saisine',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'cascade' }),
    dateSaisine: date('date_saisine', { mode: 'string' }).notNull(),
    createdAt,
    createdBy: uuid('created_by').references(() => authUsersTable.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('demarche_pcaet_date_saisine_demarche').on(
      table.demarcheId,
      table.createdAt.desc()
    ),
  ]
);
