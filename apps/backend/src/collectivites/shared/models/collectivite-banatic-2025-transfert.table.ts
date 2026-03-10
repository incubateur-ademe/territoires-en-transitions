import { integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { banatic2025CompetenceTable } from '@tet/backend/shared/models/banatic-2025-competence.table';
import { collectiviteTable } from './collectivite.table';

export const collectiviteBanatic2025TransfertTable = pgTable(
  'collectivite_banatic_2025_transfert',
  {
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id),
    competenceCode: integer('competence_code')
      .notNull()
      .references(() => banatic2025CompetenceTable.competenceCode),
    natureTransfert: text('nature_transfert'),
  },
  (table) => ({
    collectiviteBanatic2025TransfertPkey: primaryKey({
      columns: [table.collectiviteId, table.competenceCode],
      name: 'collectivite_banatic_2025_transfert_pkey',
    }),
  })
);
