import { boolean, integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { banatic2025CompetenceTable } from '@tet/backend/shared/models/banatic-2025-competence.table';
import { collectiviteTable } from './collectivite.table';

export const collectiviteBanatic2025CompetenceTable = pgTable(
  'collectivite_banatic_2025_competence',
  {
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id),
    competenceCode: integer('competence_code')
      .notNull()
      .references(() => banatic2025CompetenceTable.competenceCode),
    exercice: boolean('exercice').notNull().default(true),
  },
  (table) => ({
    collectiviteBanatic2025CompetencePkey: primaryKey({
      columns: [table.collectiviteId, table.competenceCode],
      name: 'collectivite_banatic_2025_competence_pkey',
    }),
  })
);
