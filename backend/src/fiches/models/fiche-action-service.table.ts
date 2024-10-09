import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { serviceTagTable } from '../../taxonomie/models/service-tag.table';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionServiceTagTable = pgTable(
  'fiche_action_service_tag',
  {
    fiche_id: integer('fiche_id').references(() => ficheActionTable.id),
    service_tag_id: integer('service_tag_id').references(
      () => serviceTagTable.id,
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.fiche_id, table.service_tag_id] }),
    };
  },
);
