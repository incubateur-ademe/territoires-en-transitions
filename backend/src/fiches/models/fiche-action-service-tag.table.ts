import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';
import { serviceTagTable } from '../../taxonomie/models/service-tag.table';

export const ficheActionServiceTagTable = pgTable(
  'fiche_action_service_tag',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    serviceTagId: integer('service_tag_id').references(
      () => serviceTagTable.id,
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.serviceTagId] }),
    };
  },
);
