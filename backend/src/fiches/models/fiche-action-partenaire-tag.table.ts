import { ficheActionTable } from '@/backend/plans/fiches';
import { partenaireTagTable } from '@/backend/shared';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';

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
