import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { TagBase } from './tag.basetable';

export const financeurTagTable = pgTable('financeur_tag', TagBase, (table) => {
  return {
    financeurTagNomCollectiviteIdKey: uniqueIndex(
      'financeur_tag_nom_collectivite_id_key',
    ).on(table.nom, table.collectiviteId),
  };
});
