import { createdAt, createdBy } from '@/backend/utils';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { libreTagTable } from '../../taxonomie/models/libre-tag.table';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionLibreTagTable = pgTable(
  'fiche_action_libre_tag',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    libreTagId: integer('libre_tag_id').references(() => libreTagTable.id),
    createdAt,
    createdBy,
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.libreTagId] }),
    };
  }
);
