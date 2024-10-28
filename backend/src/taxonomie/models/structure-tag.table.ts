import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { TagBase } from './tag.basetable';

export const structureTagTable = pgTable('structure_tag', TagBase, (table) => {
  return {
    structureTagNomCollectiviteIdKey: uniqueIndex(
      'structure_tag_nom_collectivite_id_key'
    ).on(table.nom, table.collectiviteId),
  };
});
