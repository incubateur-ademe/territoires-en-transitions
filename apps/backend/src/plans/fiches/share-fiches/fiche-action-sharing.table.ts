import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { createdAt, createdBy } from '@/backend/utils/column.utils';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';

export const ficheActionSharingTable = pgTable(
  'fiche_action_sharing',
  {
    ficheId: integer('fiche_id')
      .notNull()
      .references(() => ficheActionTable.id, { onDelete: 'cascade' }),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    createdAt: createdAt,
    createdBy: createdBy,
  },
  (t) => [
    primaryKey({
      columns: [t.ficheId, t.collectiviteId],
      name: 'fiche_action_sharing_fiche_id_collectivite_id_pkey',
    }),
  ]
);
