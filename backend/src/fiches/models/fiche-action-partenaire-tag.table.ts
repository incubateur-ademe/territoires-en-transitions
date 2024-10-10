import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { partenaireTagTable } from '../../taxonomie/models/partenaire-tag.table';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionPartenaireTagTable = pgTable(
  'fiche_action_partenaire_tag',
  {
    fiche_id: integer('fiche_id').references(() => ficheActionTable.id),
    partenaire_tag_id: integer('partenaire_tag_id').references(
      () => partenaireTagTable.id,
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.fiche_id, table.partenaire_tag_id] }),
    };
  },
);
