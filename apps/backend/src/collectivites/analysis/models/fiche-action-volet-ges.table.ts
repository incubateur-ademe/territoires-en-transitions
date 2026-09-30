import { levierGesIdPgEnum } from '@tet/backend/collectivites/shared/models/levier-ges-id.column';
import { voletCategoriePgEnum } from '@tet/backend/collectivites/shared/models/volet-categorie.column';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { createdAt } from '@tet/backend/utils/column.utils';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';

export const ficheActionVoletGesTable = pgTable(
  'fiche_action_volet_ges',
  {
    ficheId: integer('fiche_id')
      .notNull()
      .references(() => ficheActionTable.id, { onDelete: 'cascade' }),
    levierId: levierGesIdPgEnum('levier_id').notNull(),
    categorie: voletCategoriePgEnum('categorie').notNull(),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.ficheId, table.levierId, table.categorie] }),
  ]
);
