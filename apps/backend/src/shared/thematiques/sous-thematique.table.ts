import {
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { thematiqueTable } from './thematique.table';

export const sousThematiqueTable = pgTable(
  'sous_thematique',
  {
    id: serial('id').primaryKey(),
    nom: text('sous_thematique').notNull(),
    thematiqueId: integer('thematique_id')
      .notNull()
      .references(() => thematiqueTable.id),
  },
  (table) => {
    return {
      sousThematiqueNonThematiqueIdKey: uniqueIndex(
        'sous_thematique_sous_thematique_thematique_id_key '
      ).on(table.nom, table.thematiqueId),
    };
  }
);
