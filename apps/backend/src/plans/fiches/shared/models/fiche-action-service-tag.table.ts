import { serviceTagTable } from '@tet/backend/collectivites/tags/service-tag.table';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionServiceTagTable = pgTable(
  'fiche_action_service_tag',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id, {
      onDelete: 'cascade',
    }),
    serviceTagId: integer('service_tag_id').references(
      () => serviceTagTable.id,
      { onDelete: 'cascade' }
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.serviceTagId] }),
    };
  }
);
