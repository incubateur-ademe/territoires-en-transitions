import { integer, pgTable, serial } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import {
  financeurTagSchema,
  financeurTagTable,
} from '../../../../shared/models/financeur-tag.table';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionFinanceurTagTable = pgTable(
  'fiche_action_financeur_tag',
  {
    id: serial('id').primaryKey(),
    ficheId: integer('fiche_id')
      .notNull()
      .references(() => ficheActionTable.id),
    financeurTagId: integer('financeur_tag_id')
      .notNull()
      .references(() => financeurTagTable.id),
    montantTtc: integer('montant_ttc'),
  }
);

export const financeurSchema = createSelectSchema(
  ficheActionFinanceurTagTable
).extend({
  financeurTag: financeurTagSchema,
});

export type Financeur = z.infer<typeof financeurSchema>;
