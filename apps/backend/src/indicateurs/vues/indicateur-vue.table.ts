import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { createdAt, modifiedAt } from '@tet/backend/utils/column.utils';
import {
  index,
  integer,
  jsonb,
  pgTable,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const indicateurVueTable = pgTable(
  'indicateur_vue',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    nom: varchar('nom', { length: 100 }).notNull(),
    // Le document persisté est validé à la lecture, vue par vue.
    filtres: jsonb('filtres').$type<unknown>().notNull(),
    createdAt,
    modifiedAt,
    createdBy: uuid('created_by').references(() => authUsersTable.id, {
      onDelete: 'set null',
    }),
    modifiedBy: uuid('modified_by').references(() => authUsersTable.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('indicateur_vue_collectivite_created_at_id_idx').on(
      table.collectiviteId,
      table.createdAt,
      table.id
    ),
  ]
);

export type IndicateurVueRow = typeof indicateurVueTable.$inferSelect;
