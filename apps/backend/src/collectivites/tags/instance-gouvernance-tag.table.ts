import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { tagTableBase } from './tag.table-base';

export const instanceGouvernanceTagTable = pgTable(
  'instance_de_gouvernance_tag',
  { ...tagTableBase },
  (table) => [
    uniqueIndex('instance_de_gouvernance_tag_nom_collectivite_id_key').on(
      table.nom,
      table.collectiviteId
    ),
  ]
);
