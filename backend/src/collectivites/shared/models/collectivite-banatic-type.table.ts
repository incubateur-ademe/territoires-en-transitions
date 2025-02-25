import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

export const collectiviteBanaticSubType = {
  FiscalitePropre: 'EPCI à fiscalité propre',
  SyndicatMixte: 'Syndicat mixte',
  SyndicatCommunes: 'Syndicat de communes',
  AutreSyndicat: 'Autre type de syndicat',
};

export const collectiviteBanaticTypeTable = pgTable(
  'collectivite_banatic_type',
  {
    id: serial('id').primaryKey(),
    nom: text('nom').notNull(),
    type: text('type').notNull(), // TODO check collectiviteBanaticSubType
  }
);

export type CollectiviteBanaticType = InferSelectModel<
  typeof collectiviteBanaticTypeTable
>;
