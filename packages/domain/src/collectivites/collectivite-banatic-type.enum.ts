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
export type CollectiviteNatureType = (typeof collectiviteNature)[number];
