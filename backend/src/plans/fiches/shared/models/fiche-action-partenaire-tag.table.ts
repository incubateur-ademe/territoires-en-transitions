import { partenaireTagTable } from '@/backend/collectivites';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionPartenaireTagTable = pgTable(
  'fiche_action_partenaire_tag',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    partenaireTagId: integer('partenaire_tag_id').references(
      () => partenaireTagTable.id
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.partenaireTagId] }),
    };
  }
);
