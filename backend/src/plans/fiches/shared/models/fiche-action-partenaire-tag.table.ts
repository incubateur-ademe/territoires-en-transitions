import { partenaireTagTable } from '@/backend/collectivites/tags/partenaire-tag.table';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionPartenaireTagTable = pgTable(
  'fiche_action_partenaire_tag',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id, {
      onDelete: 'cascade',
    }),
    partenaireTagId: integer('partenaire_tag_id').references(
      () => partenaireTagTable.id,
      { onDelete: 'cascade' }
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.partenaireTagId] }),
    };
  }
);
