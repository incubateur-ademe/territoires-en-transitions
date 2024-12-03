import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { banaticCompetenceTable } from '../../../shared/models/banatic-competence.table';
import { collectiviteTable } from './collectivite.table';

export const collectiviteBanaticCompetenceTable = pgTable(
  'collectivite_banatic_competence',
  {
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id),
    competenceCode: integer('competence_code')
      .notNull()
      .references(() => banaticCompetenceTable.code),
  },
  (table) => {
    return {
      collectiviteBanaticCompetencePkey: primaryKey({
        columns: [table.collectiviteId, table.competenceCode],
        name: 'collectivite_banatic_competence_pkey',
      }),
    };
  }
);
