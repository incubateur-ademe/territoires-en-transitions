import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { tagTableBase } from './tag.table-base';

export const serviceTagTable = pgTable('service_tag', tagTableBase, (table) => {
  return {
    serviceTagNomCollectiviteIdKey: uniqueIndex(
      'service_tag_nom_collectivite_id_key'
    ).on(table.nom, table.collectiviteId),
  };
});
