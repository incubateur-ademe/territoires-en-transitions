import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { tagTableBase } from './tag.table-base';

export const financeurTagTable = pgTable(
  'financeur_tag',
  { ...tagTableBase },
  (table) => [
    uniqueIndex('financeur_tag_nom_collectivite_id_key').on(
      table.nom,
      table.collectiviteId
    ),
  ]
);
