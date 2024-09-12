import {
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';
import { thematiqueTable } from './thematique.table';

export const sousThematiqueTable = pgTable(
  'sous_thematique',
  {
    id: serial('id').primaryKey(),
    thematiqueId: integer('thematique_id')
      .notNull()
      .references(() => thematiqueTable.id),
    sousThematique: text('sous_thematique').notNull(),
  },
  (table) => {
    return {
      sousThematiqueSousThematiqueThematiqueIdKey: uniqueIndex(
        'sous_thematique_sous_thematique_thematique_id_key ',
      ).on(table.sousThematique, table.thematiqueId),
    };
  },
);
export type SousThematiqueType = InferSelectModel<typeof sousThematiqueTable>;
