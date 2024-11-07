import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { tagTableBase } from './tag.table-base';

export const partenaireTagTable = pgTable(
  'partenaire_tag',
  tagTableBase,
  (table) => {
    return {
      partenaireTagNomCollectiviteIdKey: uniqueIndex(
        'partenaire_tag_nom_collectivite_id_key'
      ).on(table.nom, table.collectiviteId),
    };
  }
);
