import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { TagBase } from './tag.basetable';

export const personneTagTable = pgTable('personne_tag', TagBase, (table) => {
  return {
    personne_tag_nom_collectivite_id_key: uniqueIndex(
      'personne_tag_nom_collectivite_id_key',
    ).on(table.nom, table.collectivite_id),
  };
});
