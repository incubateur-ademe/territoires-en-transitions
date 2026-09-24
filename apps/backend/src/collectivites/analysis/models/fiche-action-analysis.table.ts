import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { SQL_CURRENT_TIMESTAMP } from '@tet/backend/utils/column.utils';
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { FicheAnalysis } from './fiche-analysis';

export const ficheActionAnalysisTable = pgTable(
  'fiche_action_analysis',
  {
    ficheId: integer('fiche_id')
      .primaryKey()
      .references(() => ficheActionTable.id, { onDelete: 'cascade' }),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    fingerprint: text('fingerprint'),
    status: text('status').$type<FicheAnalysis['status']>().notNull(),
    retryCount: integer('retry_count').notNull().default(0),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(SQL_CURRENT_TIMESTAMP),
  },
  (table) => [
    index('fiche_action_analysis_collectivite_id_idx').on(table.collectiviteId),
  ]
);
