import { indicateurDefinitionTable } from '@/backend/indicateurs/index-domain';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionIndicateurTable = pgTable(
  'fiche_action_indicateur',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    indicateurId: integer('indicateur_id').references(
      () => indicateurDefinitionTable.id
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.indicateurId] }),
    };
  }
);
