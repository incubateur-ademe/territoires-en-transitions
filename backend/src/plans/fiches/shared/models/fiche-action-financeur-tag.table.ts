import { financeurTagTable } from '@/backend/collectivites';
import { integer, pgTable, serial } from 'drizzle-orm/pg-core';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionFinanceurTagTable = pgTable(
  'fiche_action_financeur_tag',
  {
    id: serial('id').primaryKey(),
    ficheId: integer('fiche_id')
      .notNull()
      .references(() => ficheActionTable.id),
    financeurTagId: integer('financeur_tag_id').references(
      () => financeurTagTable.id
    ),
    montantTtc: integer('montant_ttc'),
  }
);
