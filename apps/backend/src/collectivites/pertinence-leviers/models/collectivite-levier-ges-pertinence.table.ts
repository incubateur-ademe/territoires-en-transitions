import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { levierGesIdPgEnum } from '@tet/backend/collectivites/shared/models/levier-ges-id.column';
import { voletCategoriePgEnum } from '@tet/backend/collectivites/shared/models/volet-categorie.column';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { modifiedAt } from '@tet/backend/utils/column.utils';
import { integer, pgTable, unique, uuid } from 'drizzle-orm/pg-core';
import { levierPertinencePgEnum } from './levier-pertinence.column';

export const collectiviteLevierGesPertinenceTable = pgTable(
  'collectivite_levier_ges_pertinence',
  {
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    levierId: levierGesIdPgEnum('levier_id').notNull(),
    categorie: voletCategoriePgEnum('categorie'),
    pertinence: levierPertinencePgEnum('pertinence').notNull(),
    modifiedAt,
    modifiedBy: uuid('modified_by').references(() => authUsersTable.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    unique('collectivite_levier_ges_pertinence_unique')
      .on(table.collectiviteId, table.levierId, table.categorie)
      .nullsNotDistinct(),
  ]
);
