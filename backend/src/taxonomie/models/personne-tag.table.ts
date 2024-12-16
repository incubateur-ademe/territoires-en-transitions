import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { tagTableBase } from '../../shared/models/tag.table-base';

export const personneTagTable = pgTable(
  'personne_tag',
  tagTableBase,
  (table) => {
    return {
      personneTagNomCollectiviteIdKey: uniqueIndex(
        'personne_tag_nom_collectivite_id_key'
      ).on(table.nom, table.collectiviteId),
    };
  }
);
