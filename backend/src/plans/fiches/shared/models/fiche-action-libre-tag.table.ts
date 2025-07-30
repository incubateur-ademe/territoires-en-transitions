import { libreTagTable } from '@/backend/collectivites/tags/libre-tag.table';
import { createdAt, createdBy } from '@/backend/utils/column.utils';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionLibreTagTable = pgTable(
  'fiche_action_libre_tag',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id, {
      onDelete: 'cascade',
    }),
    libreTagId: integer('libre_tag_id').references(() => libreTagTable.id, {
      onDelete: 'cascade',
    }),
    createdAt,
    createdBy,
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.libreTagId] }),
    };
  }
);
