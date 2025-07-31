import { banaticCompetenceTable } from '@/backend/shared/models/banatic-competence.table';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { actionImpactTable } from './action-impact.table';

export const actionImpactBanaticCompetenceTable = pgTable(
  'action_impact_banatic_competence',
  {
    actionImpactId: integer('action_impact_id')
      .notNull()
      .references(() => actionImpactTable.id),
    competenceCode: integer('competence_code')
      .notNull()
      .references(() => banaticCompetenceTable.code),
  },
  (table) => {
    return {
      action_impact_banatic_competence_pkey: primaryKey({
        columns: [table.actionImpactId, table.competenceCode],
        name: 'action_impact_banatic_competence_pkey',
      }),
    };
  }
);
