import { createEnumObject } from '@/backend/utils/enum.utils';
import { InferSelectModel } from 'drizzle-orm';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import z from 'zod';

export const collectiviteBanaticSubType = {
  FiscalitePropre: 'EPCI à fiscalité propre',
  SyndicatMixte: 'Syndicat mixte',
  SyndicatCommunes: 'Syndicat de communes',
  AutreSyndicat: 'Autre type de syndicat',
} as const;

export const collectiviteNature = [
  'METRO',
  'CU',
  'CA',
  'CC',
  'SMF',
  'SMO',
  'SIVU',
  'SIVOM',
  'POLEM',
  'PETR',
  'EPT',
] as const;

export const collectiviteNatureEnumSchema = z.enum(collectiviteNature);

export const collectiviteNatureEnum = createEnumObject(collectiviteNature);
export type CollectiviteNatureType = (typeof collectiviteNature)[number];

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
