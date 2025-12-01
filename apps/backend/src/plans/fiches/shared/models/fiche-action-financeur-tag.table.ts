import { integer, pgTable, serial } from 'drizzle-orm/pg-core';
import { financeurTagTable } from '../../../../collectivites/tags/financeur-tag.table';
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
