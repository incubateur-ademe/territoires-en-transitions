import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { createdAt, createdBy } from '@tet/backend/utils/column.utils';
import { index, integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { demarcheTable } from './demarche.table';

/**
 * EPCI à fiscalité propre couverts par le PCAET d'un Supra. Fixé à la création
 * du dépôt ; un trigger refuse le porteur lui-même et tout ce qui n'est pas un
 * EPCI à fiscalité propre.
 */
export const demarchePcaetCollectiviteCouverteTable = pgTable(
  'demarche_pcaet_collectivite_couverte',
  {
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'cascade' }),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    createdAt,
    createdBy,
  },
  (table) => [
    primaryKey({ columns: [table.demarcheId, table.collectiviteId] }),
    index('demarche_pcaet_collectivite_couverte_collectivite_id_idx').on(
      table.collectiviteId
    ),
  ]
);
