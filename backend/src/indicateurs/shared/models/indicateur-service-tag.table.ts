import {
  collectiviteTable,
  serviceTagTable,
} from '@/backend/collectivites/index-domain';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from './indicateur-definition.table';

export const indicateurServiceTagTable = pgTable(
  'indicateur_service_tag',
  {
    indicateurId: integer('indicateur_id').references(
      () => indicateurDefinitionTable.id,
      {
        onDelete: 'cascade',
      }
    ),
    serviceTagId: integer('service_tag_id').references(
      () => serviceTagTable.id,
      {
        onDelete: 'cascade',
      }
    ),
    collectiviteId: integer('collectivite_id').references(
      () => collectiviteTable.id,
      {
        onDelete: 'cascade',
      }
    ),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.indicateurId, table.serviceTagId, table.collectiviteId],
      }),
    };
  }
);
