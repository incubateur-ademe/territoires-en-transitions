import { integer, pgTable } from 'drizzle-orm/pg-core';
import { collectiviteTable } from './collectivite.table';
import { primaryKey } from 'drizzle-orm/pg-core';
import { banaticCompetenceTable } from '../../taxonomie/models/banatic-competence.table';

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
